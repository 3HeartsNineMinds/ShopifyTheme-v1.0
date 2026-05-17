document.documentElement.classList.remove('no-js');

const readStoredTheme = () => {
  try {
    return window.localStorage.getItem('nine-minds-theme');
  } catch (error) {
    return null;
  }
};

const writeStoredTheme = (theme) => {
  try {
    window.localStorage.setItem('nine-minds-theme', theme);
  } catch (error) {
    // Storage can be unavailable in some browsers/modes. The visual toggle still works for the current page.
  }
};

const updateThemeToggleButtons = (theme) => {
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    const isDark = theme === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    button.dataset.currentTheme = theme;
  });
};

const setThemeMode = (theme) => {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
  document.body?.setAttribute('data-theme', nextTheme);
  writeStoredTheme(nextTheme);
  updateThemeToggleButtons(nextTheme);
};

const initThemeMode = () => {
  const existingTheme = document.documentElement.getAttribute('data-theme');
  setThemeMode(readStoredTheme() || existingTheme || 'light');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeMode);
} else {
  initThemeMode();
}

document.addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-theme-toggle]');
  if (!toggle) return;

  event.preventDefault();
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  setThemeMode(currentTheme === 'dark' ? 'light' : 'dark');
});

document.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (!input.matches('[data-variant-input]')) return;

  const form = input.closest('form');
  if (!form) return;

  const variantIdInput = form.querySelector('[data-variant-id]');
  const priceEl = document.querySelector('[data-product-price]');
  const addButton = form.querySelector('[data-add-to-cart]');

  if (variantIdInput) variantIdInput.value = input.value;
  if (priceEl && input.dataset.price) priceEl.textContent = input.dataset.price;

  const isAvailable = input.dataset.available === 'true';
  if (addButton) {
    addButton.disabled = !isAvailable;
    addButton.textContent = isAvailable ? 'Add to cart' : 'Sold out';
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (!form.matches('[data-cart-add]')) return;

  event.preventDefault();

  const button = form.querySelector('[type="submit"]');
  if (button) button.setAttribute('disabled', 'disabled');

  try {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });

    if (!response.ok) throw new Error('Unable to add item to cart');
    window.location.href = '/cart';
  } catch (error) {
    console.error(error);
    form.dispatchEvent(new CustomEvent('theme:error', { detail: error }));
  } finally {
    if (button) button.removeAttribute('disabled');
  }
});
