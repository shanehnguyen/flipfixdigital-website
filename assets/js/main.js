/* =====================================================================
   main.js — minimal behaviour. Scroll fade-in + nav toggle + contact form.
   ===================================================================== */

(function navToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.getElementById('mobile-nav');
  if (!toggle || !drawer) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) drawer.removeAttribute('hidden');
    else drawer.setAttribute('hidden', '');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!isOpen);
  });

  drawer.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  const mq = window.matchMedia('(min-width: 64.001em)');
  const onMq = (e) => { if (e.matches) setOpen(false); };
  if (mq.addEventListener) mq.addEventListener('change', onMq);
  else if (mq.addListener) mq.addListener(onMq);
})();

(function scrollReveal() {
  const items = document.querySelectorAll('.fade-in');
  if (!items.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  items.forEach(el => io.observe(el));
})();

(function spotsChip() {
  if (document.querySelector('.spots-chip')) return;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const month = monthNames[new Date().getMonth()];
  const chip = document.createElement('a');
  chip.className = 'spots-chip';
  chip.href = 'schedule.html';
  chip.setAttribute('aria-label', 'Only 2 spots left in ' + month + '. Schedule intro call');
  chip.innerHTML = [
    '<span class="spots-chip__pulse" aria-hidden="true"></span>',
    '<span class="spots-chip__body">',
      '<span class="spots-chip__label">Only <strong>2 spots</strong> left in ' + month + '</span>',
      '<span class="spots-chip__cta">Schedule intro call <span aria-hidden="true">&rarr;</span></span>',
    '</span>',
    '<button class="spots-chip__close" type="button" aria-label="Dismiss">&times;</button>'
  ].join('');

  chip.querySelector('.spots-chip__close').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    chip.remove();
    try { sessionStorage.setItem('ffd-spots-dismissed', '1'); } catch (err) {}
  });

  try {
    if (sessionStorage.getItem('ffd-spots-dismissed') === '1') return;
  } catch (err) {}

  document.body.appendChild(chip);

  // Hide the chip when the footer comes into view so it never overlaps footer content
  const footer = document.querySelector('.site-footer');
  if (footer && 'IntersectionObserver' in window) {
    const footerIo = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        chip.setAttribute('data-hidden', entry.isIntersecting ? 'true' : 'false');
      }
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });
    footerIo.observe(footer);
  }
})();

(function contactFormHandler() {
  const forms = document.querySelectorAll('form[data-contact-form]');
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const status = form.querySelector('[data-form-status]');
      const submit = form.querySelector('button[type="submit"]');
      const originalLabel = submit ? submit.textContent : '';

      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending…';
      }
      if (status) {
        status.textContent = '';
        status.removeAttribute('data-state');
      }

      try {
        const payload = Object.fromEntries(new FormData(form).entries());
        const response = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.success) {
          form.reset();
          if (status) {
            status.setAttribute('data-state', 'success');
            status.textContent = "Sent. I'll review your site personally within 24 hours.";
          }
        } else {
          if (status) {
            status.setAttribute('data-state', 'error');
            status.textContent = "Something went wrong. Email shanehnguyen@flipfixdigital.com directly.";
          }
        }
      } catch (err) {
        if (status) {
          status.setAttribute('data-state', 'error');
          status.textContent = "Network error. Email shanehnguyen@flipfixdigital.com directly.";
        }
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = originalLabel;
        }
      }
    });
  });
})();
