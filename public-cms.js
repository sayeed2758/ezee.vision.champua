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

function deepMergeDefaults(data, defaults) {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(data)) return defaults.map(item => item && typeof item === 'object' ? deepMergeDefaults({}, item) : item);
    if (!defaults.length) return data;
    return data.map((item, i) => {
      const template = defaults[Math.min(i, defaults.length - 1)];
      return template && typeof template === 'object' && item && typeof item === 'object' && !Array.isArray(item)
        ? deepMergeDefaults(item, template) : item;
    });
  }
  if (defaults && typeof defaults === 'object') {
    const input = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    const out = {};
    for (const key of new Set([...Object.keys(defaults), ...Object.keys(input)])) {
      out[key] = key in input ? (key in defaults ? deepMergeDefaults(input[key], defaults[key]) : input[key]) : deepMergeDefaults(undefined, defaults[key]);
    }
    return out;
  }
  return data === undefined ? defaults : data;
}
function normalizeContent(data) {
  const c = deepMergeDefaults(data || {}, defaultContent);
  // Upgrade only unchanged older default values; preserve genuinely customised content.
  const legacyStory = [
    { kicker: 'The beginning', title: 'A purpose beyond the classroom', description: 'A coaching journey built around helping learners understand their subjects, ask questions freely, and build a stronger academic foundation.' },
    { kicker: 'The teaching approach', title: 'Make every concept count', description: 'Step-by-step explanations, relatable examples, revision, and regular practice become part of the learning routine.' },
    { kicker: 'Creating learning tools', title: 'Practice that continues at home', description: 'Worksheets, handwritten notes, Daily Practice Papers, and digital teaching resources support students beyond class time.' },
    { kicker: 'The vision ahead', title: 'A trusted learning community', description: 'Keep improving the learning experience with thoughtful teaching, useful resources, and personal attention to student growth.' }
  ];
  const oldStory = data?.story?.timeline;
  if (Array.isArray(oldStory) && oldStory.length === legacyStory.length && oldStory.every((item, i) => legacyStory[i].kicker === item?.kicker && legacyStory[i].title === item?.title && legacyStory[i].description === item?.description)) c.story.timeline = defaultContent.story.timeline;
  if (data?.story?.description === 'EZEE VISION CHAMPUA is shaped by a simple belief: when concepts become clear and students get consistent support, confidence follows.') c.story.description = defaultContent.story.description;
  if (data?.hero?.note === 'Concept-first teaching · Classes 4–10') c.hero.note = defaultContent.hero.note;
  if (data?.cta?.primaryLabel === 'Ask about admission') c.cta.primaryLabel = defaultContent.cta.primaryLabel;
  if (data?.cta?.secondaryLabel === 'Explore learning paths') c.cta.secondaryLabel = defaultContent.cta.secondaryLabel;
  const oldClasses = ['Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Other / General enquiry'];
  if (Array.isArray(data?.contact?.classOptions) && JSON.stringify(data.contact.classOptions) === JSON.stringify(oldClasses)) c.contact.classOptions = [...defaultContent.contact.classOptions];
  if (!data?.contact?.mapsUrl && (!data?.contact?.address || data.contact.address === 'Jamudalak, Champua, Odisha')) {
    c.contact.address = defaultContent.contact.address;
    c.contact.mapsUrl = defaultContent.contact.mapsUrl;
  }
  if (!c.educator.badge) c.educator.badge = 'FOUNDER & EDUCATOR';
  if (!c.contact.messageGreeting) c.contact.messageGreeting = 'Hello Sir';
  if (!Array.isArray(c.teachers)) c.teachers = [];
  while (c.teachers.length < 3) c.teachers.push(JSON.parse(JSON.stringify(defaultContent.teachers[c.teachers.length])));
  return c;
}

function renderSite(data) {
  const c = normalizeContent(data || defaultContent);
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
  const artLabel = $('#heroArtLabel'); if (artLabel) artLabel.textContent = c.hero?.artLabel || 'THE EV METHOD';
  const artEyebrow = $('#heroArtEyebrow'); if (artEyebrow) artEyebrow.textContent = c.hero?.artEyebrow || 'OUR LEARNING PROMISE';
  const artHeadline = $('#heroArtHeadline'); if (artHeadline) artHeadline.textContent = c.hero?.artHeadline || 'Think. Learn.';
  const artHighlight = $('#heroArtHighlight'); if (artHighlight) artHighlight.textContent = c.hero?.artHighlight || 'Shine with confidence.';
  const artSteps = $('#heroArtSteps');
  if (artSteps) artSteps.innerHTML = (c.hero?.artSteps || [{label:'UNDERSTAND'},{label:'PRACTISE'},{label:'ACHIEVE'}]).slice(0,4).map((step,i) => `<div class="book">${esc(step.label || `STEP ${i+1}`)}</div>`).join('');

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
  const educatorTrack = $('#educatorCarouselTrack');
  if (educatorTrack) {
    const founder = { ...(c.educator || {}), displayName: c.educator?.displayName || '', badge: c.educator?.badge || 'FOUNDER & EDUCATOR', primary: true };
    const profiles = [founder, ...(Array.isArray(c.teachers) ? c.teachers : []).map(t => ({...t, primary:false, badge:t.badge || 'EDUCATOR', displayName:t.displayName || '', placeholder: !(t.name || t.photoUrl || t.bio || t.quote || (Array.isArray(t.qualifications) && t.qualifications.some(Boolean))) }))];
    while (profiles.length < 4) profiles.push({ name:'', displayName:'', role:'Add this educator from the admin panel.', bio:'Upload an approved educator photo and fill in the profile details in Educator & Teachers.', badge:'EDUCATOR PROFILE', photoUrl:'', qualifications:[], quote:'', primary:false, placeholder:true });
    educatorTrack.innerHTML = profiles.map((p,i) => {
      const fullName = p.name || (p.placeholder ? 'Educator profile coming soon' : 'Educator');
      const subName = p.displayName || '';
      const role = p.role || (p.placeholder ? 'Add role / subjects in admin' : 'Educator');
      const quals = Array.isArray(p.qualifications) ? p.qualifications : String(p.qualifications || '').split(',');
      const hasRealContent = Boolean(p.name || p.photoUrl || p.role || p.bio || p.quote || quals.filter(Boolean).length);
      const photoMarkup = p.photoUrl
        ? `<img src="${esc(safeUrl(p.photoUrl))}" alt="${esc(fullName)}" loading="lazy">`
        : `<div class="educator-photo-placeholder"><span class="placeholder-icon">${p.placeholder ? '＋' : 'EV'}</span><span>${p.placeholder ? 'Add educator photo in admin' : 'Upload a real educator photo in admin'}</span></div>`;
      const badge = p.badge || (p.primary ? 'FOUNDER & EDUCATOR' : 'EDUCATOR');
      const points = p.primary && Array.isArray(c.educator?.highlights) ? c.educator.highlights : [];
      return `<article class="educator-slide" role="group" aria-roledescription="slide" aria-label="Educator ${i+1} of ${profiles.length}">
        <div class="educator-photo-frame">${photoMarkup}<span class="educator-badge">${esc(badge)}</span></div>
        <div class="educator-copy"><span class="eyebrow"><span class="dot"></span> ${p.primary ? 'Meet your founder' : (hasRealContent ? 'Meet your educator' : 'Team profile slot')}</span>
          <h3>${esc(fullName)}${subName ? `<span class="educator-display-name">(${esc(subName)})</span>` : ''}</h3>
          <p class="educator-role">${esc(role)}</p>
          ${p.primary && quals.filter(Boolean).length ? `<div class="qualifications">${quals.filter(Boolean).map(q=>`<span class="qualification">${esc(q)}</span>`).join('')}</div>` : ''}
          ${!p.primary && quals.filter(Boolean).length ? `<div class="qualifications">${quals.filter(Boolean).map(q=>`<span class="qualification">${esc(q)}</span>`).join('')}</div>` : ''}
          ${p.primary && p.quote ? `<blockquote class="quote">“${esc(p.quote)}”</blockquote>` : p.quote ? `<blockquote class="quote">“${esc(p.quote)}”</blockquote>` : ''}
          ${!p.primary && p.bio ? `<p class="educator-bio">${esc(p.bio)}</p>` : ''}
          ${p.primary && points.length ? `<div class="team-points">${points.map(pt=>`<div class="team-point"><span class="point-icon">${esc(pt.icon || '✦')}</span><strong>${esc(pt.title || '')}</strong><small>${esc(pt.description || '')}</small></div>`).join('')}</div>` : ''}
          ${p.placeholder ? '<p class="educator-bio">This is an empty sample slot—not a real staff profile. Add the teacher name, role, photo, qualifications, and bio through the admin panel.</p>' : ''}
        </div>
      </article>`;
    }).join('');
    setupCarousel('educator', $('#educatorCarousel'), educatorTrack, $('#educatorCarouselDots'), 5500);
  }

  const galleryHead = $('#gallery .section-head');
  if (galleryHead) {
    const eyebrow = $('.eyebrow', galleryHead); if (eyebrow) eyebrow.innerHTML = `<span class="dot"></span> ${esc(c.gallery?.eyebrow || '')}`;
    const heading = $('h2', galleryHead); if (heading) heading.innerHTML = `${esc(c.gallery?.titleLead || '')} <span class="accent">${esc(c.gallery?.titleHighlight || '')}</span>`;
    const lead = $('.lead', galleryHead); if (lead) lead.textContent = c.gallery?.description || '';
  }
  const galleryGrid = $('.gallery-grid');
  const galleryItems = Array.isArray(c.gallery?.items) ? c.gallery.items : [];
  if (galleryGrid) {
    galleryGrid.innerHTML = `<div class="gallery-slider-viewport" role="region" aria-roledescription="carousel" aria-label="EZEE VISION learning gallery"><div class="gallery-slider-track" id="gallerySliderTrack">${galleryItems.map((g,i) => `<article class="gallery-slide" role="group" aria-roledescription="slide" aria-label="Gallery item ${i+1} of ${galleryItems.length}"><div class="gallery-media">${g.imageUrl ? `<img src="${esc(safeUrl(g.imageUrl))}" alt="${esc(g.alt || g.title || 'EZEE VISION CHAMPUA learning photo')}" loading="lazy">` : `<div class="gallery-placeholder"><span class="gallery-placeholder-icon">${esc(g.icon || '📚')}</span><span>Add a real approved photo for “${esc(g.title || 'this gallery item')}” in the admin panel</span></div>`}</div><div class="gallery-slide-caption"><div><h3>${esc(g.title || 'Learning moment')}</h3><p>${esc(g.description || '')}</p></div><span class="gallery-slide-index">${String(i+1).padStart(2,'0')} / ${String(galleryItems.length).padStart(2,'0')}</span></div></article>`).join('')}</div></div>
      <div class="carousel-controls gallery-controls"><button type="button" class="carousel-arrow" data-carousel-prev="gallery" aria-label="Previous gallery photo">←</button><div class="carousel-dots" id="galleryCarouselDots" aria-label="Choose gallery photo"></div><button type="button" class="carousel-arrow" data-carousel-next="gallery" aria-label="Next gallery photo">→</button></div>`;
    if (!galleryItems.length) galleryGrid.innerHTML = '<p class="form-hint">Add gallery items from the admin panel to start the slideshow.</p>';
    else setupCarousel('gallery', $('#gallery'), $('#gallerySliderTrack'), $('#galleryCarouselDots'), 6500);
  }
  const galleryNote = $('#gallery .form-hint'); if (galleryNote) { const items = galleryItems; galleryNote.textContent = items.some(g => !g.imageUrl) ? 'Slides without a photo show a clearly marked placeholder. Upload real, approved classroom or learning-resource photos from the admin panel.' : 'Gallery photos should be authentic coaching images shared with permission.'; galleryNote.style.display = items.length && items.every(g => g.imageUrl) ? 'none' : ''; }

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
    if (c.contact?.address) { const locationContent = `<span class="iconbox">⌖</span><span>Find our coaching<small>${esc(c.contact.address)}</small></span>`; entries.push(c.contact?.mapsUrl ? `<a class="contact-line has-map" href="${esc(safeUrl(c.contact.mapsUrl))}" target="_blank" rel="noopener noreferrer" aria-label="Open EZEE VISION CHAMPUA in Google Maps">${locationContent}</a>` : `<div class="contact-line">${locationContent}</div>`); }
    if (c.contact?.email) entries.push(`<a class="contact-line" href="mailto:${esc(c.contact.email)}"><span class="iconbox">✉</span><span>Email us<small>${esc(c.contact.email)}</small></span></a>`);
    contactList.innerHTML = entries.join('');
  }
  const formTitle = $('#enquiryForm h3'); if (formTitle) formTitle.textContent = c.contact?.formTitle || 'Quick enquiry';
  const formIntro = $('#enquiryForm h3 + p'); if (formIntro) formIntro.textContent = c.contact?.formIntro || 'Fill in the basics and continue on WhatsApp.';
  const formButton = $('#enquiryForm button[type="submit"]'); if (formButton) formButton.innerHTML = `${esc(c.contact?.formButtonLabel || 'Continue on WhatsApp')} <span class="arrow">↗</span>`;
  const classSelect = $('#studentClass'); if (classSelect) { const requiredClasses = Array.from({length:9},(_,i)=>`Class ${i+4}`); const options = [...new Set([...requiredClasses, ...(c.contact?.classOptions || []), 'Other / General enquiry'])]; classSelect.innerHTML = `<option value="">Choose a class</option>${options.map(v => `<option>${esc(v)}</option>`).join('')}`; }
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
        if (c.contact?.address) items.push(c.contact?.mapsUrl ? `<a href="${esc(safeUrl(c.contact.mapsUrl))}" target="_blank" rel="noopener noreferrer">${esc(c.contact.address)} ↗</a>` : `<span>${esc(c.contact.address)}</span>`);
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
  const legal = c.legal || defaultContent.legal;
  const renderLegalBody = (intro, items) => `<p class="legal-intro">${esc(intro || '')}</p>${(items || []).map(item => `<section><h3>${esc(item.heading || '')}</h3><p>${esc(item.body || '')}</p></section>`).join('')}`;
  const privacyTitle = $('#privacyDialogTitle'); if (privacyTitle) privacyTitle.textContent = legal.privacyTitle || 'Privacy Policy';
  const privacyBody = $('#privacyDialogBody'); if (privacyBody) privacyBody.innerHTML = renderLegalBody(legal.privacyIntro, legal.privacyItems);
  const termsTitle = $('#termsDialogTitle'); if (termsTitle) termsTitle.textContent = legal.termsTitle || 'Terms and Conditions';
  const termsBody = $('#termsDialogBody'); if (termsBody) termsBody.innerHTML = renderLegalBody(legal.termsIntro, legal.termsItems);
  window.EV_WHATSAPP_GREETING = c.contact?.messageGreeting || 'Hello Sir';

  renderTestimonials(c);

  attachDynamicTilt();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); } }), { threshold: .1, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.reveal:not(.is-visible),.reveal-left:not(.is-visible)').forEach(el => observer.observe(el));
  } else document.querySelectorAll('.reveal,.reveal-left').forEach(el => el.classList.add('is-visible'));
}


const carouselStates = new Map();
let carouselEventsBound = false;
function setupCarousel(kind, root, track, dots, intervalMs) {
  if (!root || !track || !dots) return;
  const previous = carouselStates.get(kind);
  if (previous?.timer) clearInterval(previous.timer);
  const slides = [...track.children];
  let index = 0;
  if (!slides.length) { dots.innerHTML = ''; return; }
  if (slides.length === 1) {
    track.style.transform = 'translateX(0)'; slides[0].setAttribute('aria-hidden','false'); dots.innerHTML = '';
    root.querySelectorAll(`[data-carousel-prev="${kind}"],[data-carousel-next="${kind}"]`).forEach(b=>b.hidden=true);
    carouselStates.delete(kind); return;
  }
  root.querySelectorAll(`[data-carousel-prev="${kind}"],[data-carousel-next="${kind}"]`).forEach(b=>b.hidden=false);
  dots.innerHTML = slides.map((_,i)=>`<button type="button" class="carousel-dot" data-carousel-dot="${i}" data-kind="${kind}" aria-label="Go to ${kind==='educator'?'educator profile':'gallery slide'} ${i+1}" aria-current="${i===0?'true':'false'}"></button>`).join('');
  const render = () => {
    track.style.transform = `translateX(-${index*100}%)`;
    [...dots.children].forEach((b,i)=>b.setAttribute('aria-current', String(i===index)));
    slides.forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i!==index)));
  };
  const step = direction => { index = (index + direction + slides.length) % slides.length; render(); restart(); };
  const go = target => { index = (target + slides.length) % slides.length; render(); restart(); };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {get index(){return index;}, step, go, timer:null, restart:()=>restart()};
  function stop(){ if (state.timer) clearInterval(state.timer); state.timer=null; }
  function restart(){ stop(); if (!reduceMotion) state.timer=setInterval(()=>{index=(index+1)%slides.length;render();},intervalMs); }
  const pause = () => stop(); const resume=()=>{ if(!reduceMotion && !state.timer) restart(); };
  if (!root.dataset.carouselInteractionsBound) {
    root.addEventListener('mouseenter', () => carouselStates.get(kind)?.pause());
    root.addEventListener('mouseleave', () => carouselStates.get(kind)?.resume());
    root.addEventListener('focusin', () => carouselStates.get(kind)?.pause());
    root.addEventListener('focusout', () => carouselStates.get(kind)?.resume());
    root.dataset.carouselInteractionsBound = '1';
  }
  state.pause = pause; state.resume = resume;
  carouselStates.set(kind,state);
  if (!carouselEventsBound) {
    document.addEventListener('ev-carousel-step', e => { if (e.detail?.kind) carouselStates.get(e.detail.kind)?.step(Number(e.detail.step) || 1); });
    document.addEventListener('ev-carousel-go', e => { if (e.detail?.kind) carouselStates.get(e.detail.kind)?.go(Number(e.detail.index) || 0); });
    carouselEventsBound = true;
  }
  render();restart();
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
