document.documentElement.classList.remove('no-js');

/* Light mode is switched off site-wide. All of the light styling still lives in
   assets/theme-modes.css under html[data-theme='light'] - to bring it back, set
   THEME_LOCK to null and re-add a [data-theme-toggle] control to the header. */
const THEME_LOCK = 'dark';

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
  if (THEME_LOCK) {
    document.documentElement.setAttribute('data-theme', THEME_LOCK);
    document.body?.setAttribute('data-theme', THEME_LOCK);
    return;
  }
  const existingTheme = document.documentElement.getAttribute('data-theme');
  setThemeMode(readStoredTheme() || existingTheme || 'dark');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeMode);
} else {
  initThemeMode();
}

document.addEventListener('click', (event) => {
  if (THEME_LOCK) return;
  const toggle = event.target.closest('[data-theme-toggle]');
  if (!toggle) return;

  event.preventDefault();
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
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

/* Rotating strapline on the landing page. Alternates the messages inside
   [data-eyebrow-rotator]; pauses while the visitor hovers or tabs into it so
   the linked message stays clickable. Rotation must keep running even under
   prefers-reduced-motion: one of the messages is the only link to the register
   popup, and an inactive message is visibility:hidden and so unclickable.
   The CSS drops the cross-fade in that case instead. */
const initEyebrowRotators = () => {
  document.querySelectorAll('[data-eyebrow-rotator]').forEach((rotator) => {
    const items = Array.from(rotator.querySelectorAll('[data-eyebrow-item]'));
    if (items.length < 2) return;

    const seconds = Number(rotator.dataset.eyebrowInterval) || 4;
    let index = items.findIndex((item) => item.classList.contains('is-active'));
    if (index < 0) index = 0;
    let timer = null;

    // Fade the current one out first, then bring the next one in, so the two
    // messages never overlap mid-transition.
    const FADE = 180;
    const show = (next) => {
      items[index].classList.remove('is-active');
      window.setTimeout(() => {
        items.forEach((item, i) => item.classList.toggle('is-active', i === next));
        index = next;
      }, FADE);
    };

    const start = () => {
      if (timer) return;
      timer = window.setInterval(() => show((index + 1) % items.length), seconds * 1000);
    };

    const stop = () => {
      window.clearInterval(timer);
      timer = null;
    };

    rotator.addEventListener('mouseenter', stop);
    rotator.addEventListener('mouseleave', start);
    rotator.addEventListener('focusin', stop);
    rotator.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    start();
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEyebrowRotators);
} else {
  initEyebrowRotators();
}

/* Register popup on the landing page. The strapline link opens a native
   <dialog> (focus trap and Esc handling come free). The form is a normal
   Shopify customer form, so submitting reloads the page; on the way back we
   reopen the dialog showing the thank you, then close it after the delay. */
const initRegisterModal = () => {
  const modal = document.querySelector('[data-register-modal]');
  if (!modal) return;

  const formBody = modal.querySelector('[data-modal-form]');
  const thanks = modal.querySelector('[data-modal-thanks]');
  const delay = Number(modal.dataset.closeDelay) || 2000;
  // <dialog>.showModal is unavailable on older Safari; fall back to the open
  // attribute, which the stylesheet styles into the same overlay.
  const native = typeof modal.showModal === 'function';

  const isOpen = () => modal.hasAttribute('open');

  const open = () => {
    if (isOpen()) return;
    if (native) {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
    document.documentElement.style.overflow = 'hidden';
    const field = modal.querySelector('input[type=email]');
    if (field) field.focus();
  };

  const close = () => {
    if (!isOpen()) return;
    if (native) {
      modal.close();
    } else {
      modal.removeAttribute('open');
    }
    document.documentElement.style.overflow = '';
  };

  // Delegated so the trigger works no matter when it is rendered, and even if
  // the rotating strapline swaps the element out.
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-register-open]');
    if (trigger) {
      event.preventDefault();
      open();
      return;
    }
    if (event.target.closest('[data-modal-close]')) {
      close();
      return;
    }
    if (event.target === modal) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) close();
  });

  modal.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
  });

  if (modal.querySelector('[data-register-success]')) {
    if (formBody) formBody.hidden = true;
    if (thanks) thanks.hidden = false;
    open();
    window.setTimeout(close, delay);
  } else if (modal.querySelector('[data-register-errors]')) {
    open();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegisterModal);
} else {
  initRegisterModal();
}
