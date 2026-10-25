import { defaultContent } from './default-content.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const STORAGE_KEY = 'ezee-site-content-v1';
const $ = (s, root = document) => root.querySelector(s);
const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeUrl = (value = '') => {
  const v = String(value || '').trim();
  if (/^data:image\//i.test(v)) return v;
  try { const u = new URL(v, location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : '#'; }
  catch { return '#'; }
};
const digits = v => String(v || '').replace(/\D/g, '');
const intlDigits = v => { const d = digits(v); return d.length === 10 ? `91${d}` : d; };
const formatPhone = v => { const d = intlDigits(v); return d.length === 12 && d.startsWith('91') ? `+91 ${d.slice(2,7)} ${d.slice(7)}` : d ? `+${d}` : ''; };
const waLink = (number, message = '') => `https://wa.me/${intlDigits(number)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
const splitLines = value => String(value || '').split('\n').map(v => esc(v)).join('<br>');

function renderSite(data) {
  const c = data || defaultContent;
  const root = document.documentElement;
  Object.entries(c.theme || {}).forEach(([key, value]) => {
    if (/^(#[0-9a-f]{3,8}|rgb|hsl)/i.test(String(value))) root.style.setProperty(`--${key}`, value);
  });
  document.title = c.seo?.title || `${c.brand?.name || 'EZEE VISION'} — Learn with Clarity`;
  const meta = $('meta[name="description"]');
  if (meta) meta.content = c.seo?.description || '';

  const brandMarkup = `${esc(c.brand?.name || 'EZEE VISION')}<small>${esc(c.brand?.tagline || '')}</small>`;
  document.querySelectorAll('.brand-name').forEach(el => el.innerHTML = brandMarkup);
  document.querySelectorAll('.brand-logo').forEach(el => { if (c.brand?.logoUrl) el.innerHTML = `<img class="brand-logo-image" src="${esc(safeUrl(c.brand.logoUrl))}" alt="${esc(c.brand?.name || 'EZEE VISION')} logo">`; else el.textContent = c.brand?.logoText || 'EV'; });
  document.querySelectorAll('.brand').forEach(el => el.setAttribute('aria-label', `${c.brand?.name || 'EZEE VISION'} Home`));
  const navCta = c.brand?.navCta || "Let's Talk";
  document.querySelectorAll('.nav-actions > .btn,.mobile-only-cta').forEach(el => { el.innerHTML = `${esc(navCta)} <span class="arrow">↗</span>`; el.href = '#contact'; });
  const marqueeTrack = $('.marquee-track');
  if (marqueeTrack) { const phrases = c.marquee?.items || []; marqueeTrack.innerHTML = [...phrases, ...phrases].map(label => `<span class="marquee-item">${esc(label)} <i>✦</i></span>`).join(''); marqueeTrack.parentElement.style.display = phrases.length ? '' : 'none'; }

  const pill = $('.admission-pill');
  if (pill) pill.innerHTML = `<span class="spark">✦</span> ${esc(c.hero?.announcement || '')}`;
  const heroTitle = $('.hero-copy h1');
  if (heroTitle) heroTitle.innerHTML = `${esc(c.hero?.headlineTop || '')}<span class="line-two">${esc(c.hero?.headlineLead || '')} <span>${esc(c.hero?.headlineHighlight || '')}</span></span>`;
  const heroDesc = $('.hero-copy > .lead');
  if (heroDesc) heroDesc.textContent = c.hero?.description || '';
  const heroButtons = $('.hero-ctas');
  if (heroButtons) {
    const btns = heroButtons.querySelectorAll('a');
    if (btns[0]) { btns[0].innerHTML = `${esc(c.hero?.ctaPrimary || 'Explore Courses')} <span class="arrow">→</span>`; btns[0].href = ['#courses','#contact','#journey'].includes(c.hero?.ctaPrimaryTarget) ? c.hero.ctaPrimaryTarget : '#courses'; }
    if (btns[1]) { btns[1].innerHTML = `${esc(c.hero?.ctaSecondary || 'Our Story')} <span class="arrow">↘</span>`; btns[1].href = ['#journey','#teachers','#contact'].includes(c.hero?.ctaSecondaryTarget) ? c.hero.ctaSecondaryTarget : '#journey'; }
  }
  const note = $('.hero-note > span');
  if (note) note.textContent = c.hero?.note || '';

  const coursesSection = $('#courses');
  const coursesGrid = $('#courses .grid-3');
  if (coursesGrid) coursesGrid.innerHTML = (c.courses || []).filter(x => x.visible !== false).map((item, i) => {
    const themes = { white: '', yellow: 'theme-yellow', pink: 'theme-pink', mint: 'theme-mint', lavender: 'theme-lavender' };
    return `<article class="card course-card reveal ${i % 3 ? `delay-${i % 3}` : ''} ${themes[item.theme] || ''}" data-tilt><div class="course-icon">${esc(item.icon || '📘')}</div><span class="course-tag">${esc(item.tag || '')}</span><h3>${esc(item.title || '')}</h3><p>${esc(item.description || '')}</p><a href="#contact" class="course-link">Ask about batches <span>↗</span></a><span class="decor-number">${String(i + 1).padStart(2, '0')}</span></article>`;
  }).join('');

  const methodIntro = $('.method-intro');
  if (methodIntro) {
    const stamp = $('.method-stamp', methodIntro); if (stamp) stamp.innerHTML = splitLines(c.method?.stamp || 'THE EV\nWAY TO\nLEARN');
    const eyebrow = $('.eyebrow', methodIntro); if (eyebrow) eyebrow.textContent = c.method?.eyebrow || '';
    const heading = $('h2', methodIntro); if (heading) heading.innerHTML = splitLines(c.method?.headline || 'Understand it.\nThen own it.');
    const lead = $('.lead', methodIntro); if (lead) lead.textContent = c.method?.description || '';
  }
  const methodList = $('.method-list');
  if (methodList) methodList.innerHTML = (c.method?.points || []).map((p, i) => `<div class="method-item reveal ${i ? `delay-${Math.min(i, 3)}` : ''}"><span class="num">${String(i + 1).padStart(2, '0')}</span><div><strong>${esc(p.title || '')}</strong><p>${esc(p.description || '')}</p></div></div>`).join('');

  const journeyIntro = $('.journey-intro');
  if (journeyIntro) {
    const eyebrow = $('.eyebrow', journeyIntro); if (eyebrow) eyebrow.innerHTML = `<span class="dot"></span> ${esc(c.story?.eyebrow || 'Our journey')}`;
    const heading = $('h2', journeyIntro); if (heading) heading.innerHTML = `${esc(c.story?.titleLead || '')} <span class="accent">${esc(c.story?.titleHighlight || '')}</span>`;
    const lead = $('.lead', journeyIntro); if (lead) lead.textContent = c.story?.description || '';
  }
  const timeline = $('.timeline');
  if (timeline) timeline.innerHTML = (c.story?.timeline || []).map((it, i) => `<div class="timeline-item reveal ${i ? `delay-${Math.min(i, 3)}` : ''}"><div class="timeline-card"><span class="timeline-kicker">${esc(it.kicker || '')}</span><h3>${esc(it.title || '')}</h3><p>${esc(it.description || '')}</p></div></div>`).join('');

  const teamHead = $('#teachers .section-head');
  if (teamHead) {
    const eyebrow = $('.eyebrow', teamHead); if (eyebrow) eyebrow.innerHTML = `<span class="dot"></span> ${esc(c.educator?.sectionEyebrow || '')}`;
    const heading = $('h2', teamHead); if (heading) heading.innerHTML = `${esc(c.educator?.sectionTitleLead || '')} <span class="accent">${esc(c.educator?.sectionTitleHighlight || '')}</span>`;
    const lead = $('.lead', teamHead); if (lead) lead.textContent = c.educator?.sectionDescription || '';
  }
  const portrait = $('.portrait-panel');
  if (portrait) {
    if (c.educator?.photoUrl) portrait.innerHTML = `<img class="educator-real-photo" src="${esc(safeUrl(c.educator.photoUrl))}" alt="${esc(c.educator.name || 'Educator')}" loading="lazy"><div class="portrait-caption">FOUNDER & EDUCATOR<small>${esc(c.brand?.name || 'EZEE VISION CHAMPUA')}</small></div>`;
    else portrait.innerHTML = `<div class="portrait-orbit"></div><div class="portrait-avatar"><div class="avatar-head"></div><div class="avatar-body"></div></div><div class="portrait-caption">FOUNDER & EDUCATOR<small>${esc(c.brand?.name || 'EZEE VISION CHAMPUA')}</small></div>`;
    portrait.setAttribute('aria-label', `${c.educator?.name || 'Educator'} profile photo`);
  }
  const teamCopy = $('.team-copy');
  if (teamCopy) {
    const eyebrow = $('.eyebrow', teamCopy); if (eyebrow) eyebrow.textContent = 'Meet your educator';
    const name = $('.name', teamCopy); if (name) name.innerHTML = `${esc(c.educator?.name || '')}<br><span class="ink-accent">(${esc(c.educator?.displayName || '')})</span>`;
    const role = $('.lead', teamCopy); if (role) role.textContent = c.educator?.role || '';
    const quals = $('.qualifications', teamCopy); if (quals) quals.innerHTML = (c.educator?.qualifications || []).filter(Boolean).map(q => `<span class="qualification">${esc(q)}</span>`).join('');
    const quote = $('.quote', teamCopy); if (quote) quote.textContent = `“${c.educator?.quote || ''}”`;
    const points = $('.team-points', teamCopy); if (points) points.innerHTML = (c.educator?.highlights || []).map(p => `<div class="team-point"><span class="point-icon">${esc(p.icon || '✦')}</span><strong>${esc(p.title || '')}</strong><small>${esc(p.description || '')}</small></div>`).join('');
  }
  const extraTeachers = $('#extraTeachers');
  if (extraTeachers) extraTeachers.innerHTML = (c.teachers || []).map(t => `<article class="card extra-teacher-card reveal" data-tilt><div class="extra-teacher-photo">${t.photoUrl ? `<img src="${esc(safeUrl(t.photoUrl))}" alt="${esc(t.name || 'Teacher')}" loading="lazy">` : `<span>EV</span>`}</div><div class="extra-teacher-copy"><h3>${esc(t.name || '')}</h3><p class="teacher-role">${esc(t.role || '')}</p><p>${esc(t.bio || '')}</p><div class="qualifications">${(Array.isArray(t.qualifications) ? t.qualifications : String(t.qualifications || '').split(',')).filter(Boolean).map(q => `<span class="qualification">${esc(q)}</span>`).join('')}</div>${t.quote ? `<blockquote class="quote">“${esc(t.quote)}”</blockquote>` : ''}</div></article>`).join('');

  const galleryHead = $('#gallery .section-head');
  if (galleryHead) {
    const eyebrow = $('.eyebrow', galleryHead); if (eyebrow) eyebrow.innerHTML = `<span class="dot"></span> ${esc(c.gallery?.eyebrow || '')}`;
    const heading = $('h2', galleryHead); if (heading) heading.innerHTML = `${esc(c.gallery?.titleLead || '')} <span class="accent">${esc(c.gallery?.titleHighlight || '')}</span>`;
    const lead = $('.lead', galleryHead); if (lead) lead.textContent = c.gallery?.description || '';
  }
  const galleryGrid = $('.gallery-grid');
  if (galleryGrid) galleryGrid.innerHTML = (c.gallery?.items || []).map((g, i) => `<article class="gallery-tile reveal ${i ? `delay-${Math.min(i % 3, 2)}` : ''}" data-tilt>${g.imageUrl ? `<img class="gallery-photo" src="${esc(safeUrl(g.imageUrl))}" alt="${esc(g.alt || g.title || 'Coaching gallery photo')}" loading="lazy">` : `<span class="not-photo-note">Add a real photo in admin</span><div class="tile-illustration" style="font-size:${i === 0 ? '5rem' : '4rem'}">${esc(g.icon || '📚')}</div>`}<div class="tile-content"><h3>${esc(g.title || '')}</h3><p>${esc(g.description || '')}</p></div></article>`).join('');
  const galleryNote = $('#gallery .form-hint'); if (galleryNote) { const items = c.gallery?.items || []; galleryNote.textContent = items.some(g => !g.imageUrl) ? 'Cards without an uploaded image use a decorative placeholder. Add real, approved coaching photos from the admin panel.' : 'Gallery photos should be authentic coaching images shared with permission.'; galleryNote.style.display = items.length && items.every(g => g.imageUrl) ? 'none' : ''; }
  const educatorNote = $('#teachers > .wrap > .form-hint'); if (educatorNote) educatorNote.style.display = c.educator?.photoUrl ? 'none' : '';

  const contactSection = $('#contact');
  const contactHead = $('.contact-grid .reveal-left');
  if (contactHead) {
    const eyebrow = $('.eyebrow', contactHead); if (eyebrow) eyebrow.innerHTML = `<span class="dot"></span> Let's connect`;
    const heading = $('h2', contactHead); if (heading) heading.innerHTML = `${esc(c.contact?.titleLead || '')} <span class="accent">${esc(c.contact?.titleHighlight || '')}</span>`;
    const lead = $('.lead', contactHead); if (lead) lead.textContent = c.contact?.description || '';
  }
  const phone1 = digits(c.contact?.phone1 || ''); const phone2 = digits(c.contact?.phone2 || '');
  const contactList = $('.contact-list');
  if (contactList) {
    const w = digits(c.contact?.whatsapp || '');
    const entries = [];
    if (w) entries.push(`<a class="contact-line" href="${waLink(w)}" target="_blank" rel="noopener"><span class="iconbox">💬</span><span>WhatsApp us<small>${esc(formatPhone(w))}</small></span></a>`);
    if (phone1) entries.push(`<a class="contact-line" href="tel:+${esc(intlDigits(phone1))}"><span class="iconbox">☎</span><span>Call for enquiries<small>${esc(formatPhone(phone1))}</small></span></a>`);
    if (phone2) entries.push(`<a class="contact-line" href="tel:+${esc(intlDigits(phone2))}"><span class="iconbox">✆</span><span>Additional contact<small>${esc(formatPhone(phone2))}</small></span></a>`);
    if (c.contact?.address) entries.push(`<div class="contact-line ${c.contact?.mapsUrl ? 'has-map' : ''}"><span class="iconbox">⌖</span><span>${c.contact?.mapsUrl ? `<a href="${esc(safeUrl(c.contact.mapsUrl))}" target="_blank" rel="noopener">Find our coaching</a>` : 'Find our coaching'}<small>${esc(c.contact.address)}</small></span></div>`);
    if (c.contact?.email) entries.push(`<a class="contact-line" href="mailto:${esc(c.contact.email)}"><span class="iconbox">✉</span><span>Email us<small>${esc(c.contact.email)}</small></span></a>`);
    contactList.innerHTML = entries.join('');
  }
  const formTitle = $('#enquiryForm h3'); if (formTitle) formTitle.textContent = c.contact?.formTitle || 'Quick enquiry';
  const formIntro = $('#enquiryForm h3 + p'); if (formIntro) formIntro.textContent = c.contact?.formIntro || 'Fill in the basics and continue on WhatsApp.';
  const formButton = $('#enquiryForm button[type="submit"]'); if (formButton) formButton.innerHTML = `${esc(c.contact?.formButtonLabel || 'Continue on WhatsApp')} <span class="arrow">↗</span>`;
  const classSelect = $('#studentClass'); if (classSelect) classSelect.innerHTML = `<option value="">Choose a class</option>${(c.contact?.classOptions || []).map(v => `<option>${esc(v)}</option>`).join('')}`;
  const subjectSelect = $('#studentSubject'); if (subjectSelect) subjectSelect.innerHTML = `<option value="">Choose a subject</option>${(c.contact?.subjectOptions || []).map(v => `<option>${esc(v)}</option>`).join('')}`;
  const footerAbout = $('.footer-about'); if (footerAbout) footerAbout.textContent = c.contact?.footerSummary || '';
  document.querySelectorAll('.footer-brand .brand-name').forEach(el => el.innerHTML = brandMarkup);
  const footer = $('footer');
  if (footer) {
    const linksCols = footer.querySelectorAll('.footer-main > div');
    if (linksCols[2]) {
      const links = linksCols[2].querySelector('.footer-links');
      if (links) {
        const items = [];
        if (c.contact?.address) items.push(`<span>${esc(c.contact.address)}</span>`);
        const wFooter = digits(c.contact?.whatsapp || ''); if (wFooter) items.push(`<a href="${waLink(wFooter)}" target="_blank" rel="noopener">${esc(formatPhone(wFooter))}</a>`);
        if (phone1) items.push(`<a href="tel:+${esc(intlDigits(phone1))}">${esc(formatPhone(phone1))}</a>`);
        if (phone2) items.push(`<a href="tel:+${esc(intlDigits(phone2))}">${esc(formatPhone(phone2))}</a>`);
        if (c.contact?.email) items.push(`<a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a>`);
        items.push('<a href="#contact">Admission enquiries ↗</a>'); links.innerHTML = items.join('');
      }
    }
    const bottom = $('.footer-bottom');
    if (bottom) {
      const spans = bottom.querySelectorAll(':scope > span');
      if (spans[0]) spans.innerHTML = `© <span id="yearNow">${new Date().getFullYear()}</span> ${esc(c.brand?.legalName || `${c.brand?.name || 'EZEE VISION'} CHAMPUA`)}. All rights reserved.`;
      if (spans[1]) spans.innerHTML = esc(c.contact?.footerSignature || 'Made with ♥ for curious minds · Shahid Sir').replace(/♥/g, '<span class="footer-heart">♥</span>');
    }
  }
  const wNum = digits(c.contact?.whatsapp || '');
  window.EV_WHATSAPP_NUMBER = intlDigits(wNum);
  const floatWa = $('.floating-whatsapp'); if (floatWa && wNum) { floatWa.href = waLink(wNum); floatWa.style.display = 'grid'; } else if (floatWa) floatWa.style.display = 'none';
  document.querySelectorAll('.mobile-only-cta,.nav-actions > .btn').forEach(el => { if (el.textContent.includes('Talk') || el.textContent.includes('Enquire')) el.href = '#contact'; });

  const finalCta = $('#finalCta');
  if (finalCta) {
    const ctaEyebrow = $('.eyebrow', finalCta); if (ctaEyebrow) ctaEyebrow.textContent = c.cta?.eyebrow || 'Your next step';
    const ctaHeading = $('h2', finalCta); if (ctaHeading) ctaHeading.innerHTML = `${esc(c.cta?.headlineTop || 'Ready to learn')}<br><span class="accent">${esc(c.cta?.headlineBottom || 'with confidence?')}</span>`;
    const ctaDesc = $('.lead', finalCta); if (ctaDesc) ctaDesc.textContent = c.cta?.description || '';
    const ctaLinks = finalCta.querySelectorAll('.cta-actions a');
    if (ctaLinks[0]) ctaLinks[0].innerHTML = `${esc(c.cta?.primaryLabel || 'Ask about admission')} <span class="arrow">↗</span>`;
    if (ctaLinks[1]) ctaLinks[1].innerHTML = `${esc(c.cta?.secondaryLabel || 'Explore learning paths')} <span class="arrow">→</span>`;
  }
  if (finalCta && c.visibility?.finalCta === false) finalCta.style.display = 'none';
  const visibilityTargets = { courses: '#courses', method: '.method-band', story: '#journey', educator: '#teachers', gallery: '#gallery' };
  Object.entries(visibilityTargets).forEach(([key, selector]) => { const el = $(selector); if (el) el.style.display = c.visibility?.[key] === false ? 'none' : ''; });
  renderTestimonials(c);

  attachDynamicTilt();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); } }), { threshold: .1, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.reveal:not(.is-visible),.reveal-left:not(.is-visible)').forEach(el => observer.observe(el));
  } else document.querySelectorAll('.reveal,.reveal-left').forEach(el => el.classList.add('is-visible'));
}


function attachDynamicTilt() {
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion) return;
  document.querySelectorAll('#courses [data-tilt], #extraTeachers [data-tilt], #gallery [data-tilt]').forEach(card => {
    if (card.dataset.cmsTilt === '1') return;
    card.dataset.cmsTilt = '1';
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.transform = `perspective(900px) rotateX(${(0.5-y)*5}deg) rotateY(${(x-0.5)*6}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

function renderTestimonials(c) {
  let sec = $('#testimonials');
  const items = c.testimonials?.items || [];
  if (!c.visibility?.testimonials || !items.length) { if (sec) sec.remove(); return; }
  if (!sec) {
    sec = document.createElement('section'); sec.id = 'testimonials'; sec.className = 'section';
    const target = $('#finalCta'); if (target) target.before(sec); else $('#contact')?.before(sec);
  }
  sec.innerHTML = `<div class="wrap"><div class="section-head reveal"><span class="eyebrow"><span class="dot"></span> ${esc(c.testimonials.eyebrow || '')}</span><h2>${esc(c.testimonials.title || '')}</h2></div><div class="testimonial-grid">${items.map(t => `<article class="card testimonial-card reveal"><div class="testimonial-stars" aria-label="Five stars">★★★★★</div><blockquote>“${esc(t.quote || '')}”</blockquote><strong>${esc(t.name || '')}</strong><small>${esc(t.context || '')}</small></article>`).join('')}</div></div>`;
}

const cmsDebug = new URLSearchParams(location.search).get('debug-cms') === '1';
function showCmsDiagnostic(status, detail = '') {
  if (!cmsDebug) return;
  let panel = document.getElementById('cms-debug-panel');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'cms-debug-panel';
    panel.style.cssText = 'position:fixed;z-index:99999;left:10px;right:10px;bottom:10px;padding:12px 14px;border:2px solid #201936;border-radius:12px;background:#fff;color:#201936;font:600 13px/1.45 system-ui,sans-serif;box-shadow:0 4px 0 #ff1654;overflow-wrap:anywhere;';
    document.body.appendChild(panel);
  }
  panel.textContent = `CMS DIAGNOSTIC: ${status}${detail ? ' — ' + detail : ''}`;
}

async function loadContent() {
  const params = new URLSearchParams(location.search);
  const preview = params.get('preview') === '1';
  const local = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; } })();
  if (preview && local) { renderSite(local); showCmsDiagnostic('LOCAL PREVIEW', 'Using this browser draft, not Firestore.'); return; }
  if (!isFirebaseConfigured) {
    showCmsDiagnostic('FIREBASE CONFIG INVALID', 'firebase-config.js reports incomplete configuration.');
    renderSite(local || defaultContent); return;
  }
  showCmsDiagnostic('CONNECTING', 'Reading Firestore document site/content…');
  try {
    const [{ initializeApp, getApps, getApp }, { getFirestore, doc, getDoc }] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js')
    ]);
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snap = await getDoc(doc(db, 'site', 'content'));
    if (snap.exists()) {
      const cloudContent = snap.data();
      renderSite(cloudContent);
      showCmsDiagnostic('LIVE FIRESTORE', `site/content loaded. tagline=${String(cloudContent.brand?.tagline || '(empty)')}; updated=${String(cloudContent.cmsUpdatedAt || '(no timestamp)')}`);
      return;
    }
    showCmsDiagnostic('DOCUMENT NOT FOUND', 'Firestore document site/content does not exist. Showing fallback content.');
  } catch (err) {
    console.error('Cloud content not available; showing local/default content.', err);
    showCmsDiagnostic('FIRESTORE READ FAILED', `${err.code || err.name || 'Error'}: ${err.message || String(err)}`);
  }
  renderSite(local || defaultContent);
}

loadContent().catch(err => {
  console.error('Website content loader failed.', err);
  showCmsDiagnostic('CMS LOADER CRASHED', `${err.name || 'Error'}: ${err.message || String(err)}`);
  renderSite(defaultContent);
});
