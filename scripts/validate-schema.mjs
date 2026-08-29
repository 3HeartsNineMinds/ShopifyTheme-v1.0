/**
 * Checks the Shopify schema rules that `shopify theme check` does NOT catch but
 * the Online Store rejects on upload:
 *   - a range setting must have at most 101 steps
 *   - (max - min) must divide exactly by step
 *   - the schema default must land on a step
 *   - every value saved in templates/*.json must land on a step and be in range
 *
 * Run: npm run validate
 */
import { readFileSync, readdirSync } from 'node:fs';

const problems = [];
const ranges = new Map(); // "section:id" -> range setting

const stripJsonComments = (t) => t.replace(/^\s*\/\*[\s\S]*?\*\//, '');
// floats: compare on a small epsilon so 3.4 - 2 = 1.4000000000000004 passes
const onStep = (value, min, step) => {
  const n = (value - min) / step;
  return Math.abs(n - Math.round(n)) < 1e-6;
};

for (const file of readdirSync('sections').filter((f) => f.endsWith('.liquid'))) {
  const src = readFileSync(`sections/${file}`, 'utf8');
  const match = src.match(/{% schema %}([\s\S]*?){% endschema %}/);
  if (!match) continue;

  let schema;
  try {
    schema = JSON.parse(match[1]);
  } catch (error) {
    problems.push(`${file}: schema is not valid JSON - ${error.message}`);
    continue;
  }

  for (const setting of schema.settings || []) {
    if (setting.type !== 'range') continue;
    const { id, min, max, step, default: dflt } = setting;
    const where = `sections/${file} [${id}]`;

    if ([min, max, step].some((v) => typeof v !== 'number')) {
      problems.push(`${where}: min/max/step must all be numbers`);
      continue;
    }
    const steps = (max - min) / step;
    if (Math.abs(steps - Math.round(steps)) > 1e-6) {
      problems.push(`${where}: (max-min)/step = ${steps} is not a whole number`);
    }
    if (Math.round(steps) > 101) {
      problems.push(`${where}: ${Math.round(steps)} steps exceeds Shopify's limit of 101`);
    }
    if (dflt !== undefined && !onStep(dflt, min, step)) {
      problems.push(`${where}: default ${dflt} is not on a step from ${min} by ${step}`);
    }
    if (dflt !== undefined && (dflt < min || dflt > max)) {
      problems.push(`${where}: default ${dflt} is outside ${min}..${max}`);
    }
    ranges.set(`${schema.name}:${id}`, { id, min, max, step, where });
    ranges.set(`type:${file.replace(/\.liquid$/, '')}:${id}`, { id, min, max, step, where });
  }
}

for (const file of readdirSync('templates').filter((f) => f.endsWith('.json'))) {
  let json;
  try {
    json = JSON.parse(stripJsonComments(readFileSync(`templates/${file}`, 'utf8')));
  } catch (error) {
    problems.push(`templates/${file}: not valid JSON - ${error.message}`);
    continue;
  }
  for (const [key, section] of Object.entries(json.sections || {})) {
    for (const [id, value] of Object.entries(section.settings || {})) {
      const range = ranges.get(`type:${section.type}:${id}`);
      if (!range || typeof value !== 'number') continue;
      if (value < range.min || value > range.max) {
        problems.push(`templates/${file} ${key}.${id} = ${value} is outside ${range.min}..${range.max}`);
      } else if (!onStep(value, range.min, range.step)) {
        problems.push(`templates/${file} ${key}.${id} = ${value} is not on a step from ${range.min} by ${range.step}`);
      }
    }
  }
}

if (problems.length) {
  console.error('Schema problems Shopify would reject:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`OK: ${ranges.size / 2} range settings valid, template values on step.`);
