document.documentElement.classList.remove('no-js');

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
