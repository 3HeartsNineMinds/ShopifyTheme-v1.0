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
  setThemeMode(readStoredTheme() || existingTheme || 'dark');
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

    const show = (next) => {
      items.forEach((item, i) => item.classList.toggle('is-active', i === next));
      index = next;
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
  if (!modal || typeof modal.showModal !== 'function') return;

  const formBody = modal.querySelector('[data-modal-form]');
  const thanks = modal.querySelector('[data-modal-thanks]');
  const delay = Number(modal.dataset.closeDelay) || 2000;

  const open = () => {
    if (!modal.open) modal.showModal();
  };
  const close = () => {
    if (modal.open) modal.close();
  };

  document.querySelectorAll('[data-register-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      open();
    });
  });

  modal.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', close);
  });

  // Clicking the backdrop closes; clicking the panel must not.
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
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
