document.documentElement.classList.remove('no-js');

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
