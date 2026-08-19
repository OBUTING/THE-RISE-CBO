/* ==========================================================================
   CONTACT — public Contact form + Get Involved modal form.
   ========================================================================== */

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

/* ---------------- Contact page form (contact.html only) ---------------- */
const contactForm = document.getElementById('form-contact');
if (contactForm) {
  const contactSuccess = document.getElementById('contact-form-success');
  const contactError = document.getElementById('contact-form-error');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    contactError.hidden = true;
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const reason = document.getElementById('contact-reason').value;
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !isValidEmail(email) || !message) {
      contactError.textContent = 'Please add your name, a valid email, and a message.';
      contactError.hidden = false;
      return;
    }
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await Store.addInquiry({ type: 'general', source: 'contact', name, email, phone, interestArea: reason, message });
      contactForm.hidden = true;
      contactSuccess.hidden = false;
      App.showToast('Message sent \u2014 thank you!', 'success');
      document.dispatchEvent(new CustomEvent('inquiry:added'));
    } catch (err) {
      console.error(err);
      contactError.textContent = 'Something went wrong sending your message. Please try again.';
      contactError.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  document.getElementById('contact-send-another').addEventListener('click', () => {
    contactForm.reset();
    contactForm.hidden = false;
    contactSuccess.hidden = true;
  });
}

/* ---------------- Get Involved modal form ---------------- */
const giForm = document.getElementById('form-get-involved');
const giSuccess = document.getElementById('gi-form-success');
const giError = document.getElementById('gi-form-error');

giForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  giError.hidden = true;
  const name = document.getElementById('gi-name').value.trim();
  const email = document.getElementById('gi-email').value.trim();
  const phone = document.getElementById('gi-phone').value.trim();
  const interest = document.getElementById('gi-interest').value;
  const area = document.getElementById('gi-area').value.trim();
  const message = document.getElementById('gi-message').value.trim();

  if (!name || !isValidEmail(email) || !message) {
    giError.textContent = 'Please add your name, a valid email, and a short message.';
    giError.hidden = false;
    return;
  }
  const submitBtn = giForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    await Store.addInquiry({ type: interest, source: 'get-involved', name, email, phone, interestArea: area, message });
    giForm.hidden = true;
    giSuccess.hidden = false;
    App.showToast('Thanks for reaching out!', 'success');
    document.dispatchEvent(new CustomEvent('inquiry:added'));
  } catch (err) {
    console.error(err);
    giError.textContent = 'Something went wrong sending that. Please try again.';
    giError.hidden = false;
  } finally {
    submitBtn.disabled = false;
  }
});

function resetGetInvolvedModal() {
  giForm.reset();
  giForm.hidden = false;
  giSuccess.hidden = true;
  giError.hidden = true;
}

/* Pre-fill from Programs page "Request Support" / "Partner with this Program" */
document.addEventListener('modal:opened', (e) => {
  if (e.detail.modalId !== 'modal-get-involved') return;
  const trigger = e.detail.triggerEl;
  if (!trigger || !trigger.dataset) return;
  const intent = trigger.dataset.intent;
  const program = trigger.dataset.program;
  if (!intent && !program) return;
  const interestSelect = document.getElementById('gi-interest');
  const areaInput = document.getElementById('gi-area');
  const messageInput = document.getElementById('gi-message');
  if (intent === 'partner') interestSelect.value = 'partner';
  else if (intent === 'support') interestSelect.value = 'general';
  if (program) {
    areaInput.value = program;
    if (!messageInput.value) {
      messageInput.value = intent === 'partner'
        ? `Hello, I'm interested in partnering with The Rise CBO on the ${program} program.`
        : `Hello, I'd like to request support for the ${program} program.`;
    }
  }
});
document.addEventListener('modal:closed', (e) => {
  if (e.detail.modalId === 'modal-get-involved') resetGetInvolvedModal();
});
