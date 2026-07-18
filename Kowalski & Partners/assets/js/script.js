// ---------- HERO CHIPS ----------
// ---------- ABOUT STATS COUNTER ----------
const clearStaleInteractiveFocus = () => {
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && activeElement.matches('a, button')) {
    activeElement.blur();
  }
};

let pointerInitiatedFocus = false;

document.addEventListener('pointerdown', () => {
  pointerInitiatedFocus = true;
}, { capture: true, passive: true });

document.addEventListener('keydown', () => {
  pointerInitiatedFocus = false;
}, { capture: true });

document.addEventListener('focusin', (event) => {
  if (!pointerInitiatedFocus) return;

  const interactive = event.target instanceof Element
    ? event.target.closest('a, button')
    : null;
  if (interactive instanceof HTMLElement) interactive.blur();
});

document.addEventListener('pointerup', (event) => {
  const interactive = event.target instanceof Element
    ? event.target.closest('a, button')
    : null;
  if (interactive instanceof HTMLElement) {
    requestAnimationFrame(() => {
      if (document.activeElement === interactive) interactive.blur();
    });
  }
}, { passive: true });

window.addEventListener('pageshow', () => {
  pointerInitiatedFocus = false;
  requestAnimationFrame(clearStaleInteractiveFocus);
});

const statNums = document.querySelectorAll('.stat-num');

function animateCount(el){
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  let startTime = null;

  function step(timestamp){
    if(startTime === null) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // smooth ease-out
    const value = Math.round(eased * target);
    el.textContent = value + '+';
    if(progress < 1){
      requestAnimationFrame(step);
    } else {
      el.textContent = target + '+';
    }
  }
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      statNums.forEach(animateCount);
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.4 });

const aboutStatsEl = document.getElementById('aboutStats');
if(aboutStatsEl){
  statsObserver.observe(aboutStatsEl);
}

const chipsData = [
  "Corporate Law", "Compliance", "M&A Transactions", "Immigration", "IP Law",
  "Due Diligence", "Real Estate", "Arbitration", "Tax Advisory"
];

const heroChips = document.getElementById('heroChips');

function createChipGroup(){
  const group = document.createElement('div');
  group.className = 'hero-chips-group';

  chipsData.forEach(label => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = label;
    group.appendChild(chip);
  });

  return group;
}

if(heroChips){
  const track = document.createElement('div');
  track.className = 'hero-chips-track';
  track.appendChild(createChipGroup());
  track.appendChild(createChipGroup());
  heroChips.replaceChildren(track);
}

// ---------- NAV ACTIVE STATE (scroll-spy + click) ----------
const navLinks = Array.from(document.querySelectorAll('.nav-link[data-nav]'));
const navTargets = navLinks
  .map(link => {
    const id = link.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    return el ? { link, el } : null;
  })
  .filter(Boolean);

function setActiveNav(link){
  navLinks.forEach(l => l.classList.remove('active'));
  if(link) link.classList.add('active');
}

navLinks.forEach(link => {
  link.addEventListener('click', () => setActiveNav(link));
});

function updateNavSpy(){
  const triggerLine = 76 + 40; // header height + a little breathing room

  // if we're at the very bottom of the page, force the last section active
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  if(atBottom && navTargets.length){
    setActiveNav(navTargets[navTargets.length - 1].link);
    return;
  }

  let current = navTargets[0] ? navTargets[0].link : null;
  navTargets.forEach(({ link, el }) => {
    const rect = el.getBoundingClientRect();
    if(rect.top <= triggerLine){
      current = link;
    }
  });
  setActiveNav(current);
}

let navSpyTicking = false;
window.addEventListener('scroll', () => {
  if(!navSpyTicking){
    window.requestAnimationFrame(() => {
      updateNavSpy();
      navSpyTicking = false;
    });
    navSpyTicking = true;
  }
}, { passive: true });

updateNavSpy();

// ---------- CONTACT MODAL ----------
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const contactForm = document.getElementById('contactForm');

function openModal(){
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(){
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.open-modal').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    openModal();
  });
});

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', e => {
  if(e.target === modalOverlay){
    closeModal();
  }
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && modalOverlay.classList.contains('active')){
    closeModal();
  }
});

contactForm.addEventListener('submit', e => {
  e.preventDefault();
  closeModal();
  contactForm.reset();
});

const practiceData = [
  {
    title: "Corporate Law &amp; Governance",
    text: "Full-service legal counsel for modern enterprises — from incorporation and governance to international group structuring and M&amp;A readiness."
  },
  {
    title: "M&amp;A &amp; Transaction Advisory",
    text: "Expert legal guidance for complex transactions, including due diligence, deal structuring, and cross-border execution at every stage."
  },
  {
    title: "Immigration &amp; Workforce Relocation",
    text: "Comprehensive immigration services helping companies relocate key talent — from residence permits and work visas to long-term settlement strategies."
  },
  {
    title: "Real Estate &amp; Property Law",
    text: "End-to-end legal management for commercial property acquisitions, development projects, leasing agreements, and permitting."
  }
];

const practiceCard = document.getElementById('practiceCard');

practiceData.forEach(item => {
  const cell = document.createElement('div');
  cell.className = 'practice-item';
  cell.innerHTML = `
    <h3>${item.title}</h3>
    <p>${item.text}</p>
    <div class="practice-btn">
      <span class="btn-label">More Info</span>
      <span class="btn-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M7 7h10v10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    </div>
  `;
  practiceCard.appendChild(cell);
});

const expectData = [
  {
    title: "Business Focused",
    text: "We speak the language of business, not just the language of codes and statutes.",
    icon: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12h18" stroke-linecap="round"/>`
  },
  {
    title: "International Expertise",
    text: "Years of experience advising foreign clients on the nuances of Polish jurisdiction.",
    icon: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-6-4-9s1.5-6.4 4-9z" stroke-linecap="round" stroke-linejoin="round"/>`
  },
  {
    title: "Fast Response Times",
    text: "Agile legal support that moves at the speed of your technology company.",
    icon: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2" stroke-linecap="round" stroke-linejoin="round"/>`
  },
  {
    title: "Transparent Pricing",
    text: "Clear fee structures and fixed project rates. No billable-hour surprises.",
    icon: `<path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" stroke-linecap="round" stroke-linejoin="round"/>`
  }
];

const expectCardsEl = document.getElementById('expectCards');

expectData.forEach(item => {
  const card = document.createElement('div');
  card.className = 'expect-card';
  card.innerHTML = `
    <h3>${item.title}</h3>
    <p>${item.text}</p>
    <div class="expect-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${item.icon}</svg>
    </div>
  `;
  expectCardsEl.appendChild(card);
});

const industriesData = [
  { label: "Technology", icon: `<rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" stroke-linecap="round"/><rect x="4" y="4" width="16" height="16" rx="2"/>` },
  { label: "Construction", icon: `<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" stroke-linecap="round"/><path d="M10 21v-3h4v3"/>` },
  { label: "E-Commerce", icon: `<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" stroke-linecap="round" stroke-linejoin="round"/>` },
  { label: "Healthcare", icon: `<path d="M12 21s-7.5-4.6-10-9.2C.4 8.2 2 4.5 5.6 4c2-.3 3.7.7 4.9 2.3C11.7 4.7 13.4 3.7 15.4 4c3.6.5 5.2 4.2 3.6 7.8C16.5 16.4 12 21 12 21z"/>` },
  { label: "Manufacturing", icon: `<rect x="2" y="8" width="9" height="12" rx="1"/><path d="M11 12l6-4v10l6-4v6H11" stroke-linecap="round" stroke-linejoin="round"/>` },
  { label: "Real Estate", icon: `<path d="M3 11l9-7 9 7" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" stroke-linecap="round" stroke-linejoin="round"/>` },
  { label: "Financial Services", icon: `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20" stroke-linecap="round"/>` },
  { label: "International Trade", icon: `<path d="M2 17h13v-4.5a1 1 0 0 0-.3-.7l-3-3A1 1 0 0 0 11 8.5H2z" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 12h3.5a1 1 0 0 1 .8.4l2.2 2.6a1 1 0 0 1 .5.9V17h-2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>` }
];

const industriesGrid = document.getElementById('industriesGrid');

industriesData.forEach(item => {
  const card = document.createElement('div');
  card.className = 'industry-card';
  card.innerHTML = `
    <div class="industry-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${item.icon}</svg>
    </div>
    <span class="industry-label">${item.label}</span>
  `;
  industriesGrid.appendChild(card);
});

const processData = [
  { title: "Initial Consultation", text: "Understanding your business objectives, constraints, and long-term vision in Poland." },
  { title: "Legal Assessment", text: "A deep dive into your specific case with a clear roadmap of risks and opportunities." },
  { title: "Strategy Development", text: "Drafting precise legal documents and execution plans tailored to your deal." },
  { title: "Execution", text: "Navigating administration, court, and negotiations to achieve the desired outcome." },
  { title: "Long-Term Support", text: "Ongoing advisory to ensure your business remains compliant and agile." }
];

const processStepsEl = document.getElementById('processSteps');
const processSection = document.getElementById('processSection');
let processSteps = [];

processData.forEach((item, i) => {
  const step = document.createElement('div');
  step.className = 'step';
  step.innerHTML = `
    <div class="step-marker-wrap">
      <div class="step-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="step-line"></div>
    </div>
    <div class="step-content">
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>
  `;
  processStepsEl.appendChild(step);
  processSteps.push(step);
});

processSteps[0].classList.add('active');

function updateProcessStep(){
  // trigger line sits 40% up from the bottom of the viewport (i.e. 60% down from the top);
  // whichever step's top has crossed it (furthest down) is active
  const triggerLine = window.innerHeight * 0.6;

  let activeIndex = 0;
  processSteps.forEach((step, i) => {
    const rect = step.getBoundingClientRect();
    if(rect.top <= triggerLine){
      activeIndex = i;
    }
  });

  processSteps.forEach((step, i) => {
    step.classList.toggle('active', i === activeIndex);
  });
}

let processTicking = false;
window.addEventListener('scroll', () => {
  if(!processTicking){
    window.requestAnimationFrame(() => {
      updateProcessStep();
      processTicking = false;
    });
    processTicking = true;
  }
}, { passive: true });

updateProcessStep();

const faqData = [
  {
    q: "How quickly can we start?",
    a: "We can get started within 1-2 business days after our initial consultation. Our streamlined onboarding process ensures you receive legal support quickly, with dedicated team assignment within 24 hours."
  },
  {
    q: "Do you work with foreign companies?",
    a: "Yes, a large share of our clients are foreign companies expanding into new markets. We handle cross-border contracts, local compliance, and act as your on-the-ground legal partner."
  },
  {
    q: "Do you provide English-speaking lawyers?",
    a: "Absolutely. Every client is paired with at least one fully English-speaking lawyer, so you never lose nuance in translation during negotiations or filings."
  },
  {
    q: "Can you assist with company formation in Poland?",
    a: "Yes, we manage the entire formation process end-to-end: entity selection, registration, tax setup, and opening local bank accounts, usually completed within two to three weeks."
  },
  {
    q: "What are your consultation fees?",
    a: "Your first consultation is free of charge. After that, we offer both fixed-fee packages and hourly rates depending on the scope, so you always know costs upfront."
  }
];

const questionsEl = document.getElementById('questions');
const chatScroll = document.getElementById('chatScroll');

let pairs = [];

// Build left list
faqData.forEach((item, i) => {
  const qItem = document.createElement('div');
  qItem.className = 'q-item';
  qItem.dataset.index = i;

  qItem.innerHTML = `
    <div class="q-row">
      <div class="q-text">${item.q}</div>
      <div class="q-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div class="q-answer"><div>${item.a}</div></div>
  `;

  qItem.addEventListener('click', () => selectQuestion(i));
  questionsEl.appendChild(qItem);
});

// Build right chat
faqData.forEach((item, i) => {
  const pair = document.createElement('div');
  pair.className = 'pair';
  pair.dataset.index = i;
  pair.innerHTML = `
    <div class="msg-row user">
      <div class="bubble">${item.q}</div>
      <div class="avatar user-av">JD</div>
    </div>
    <div class="msg-row bot">
      <div class="avatar bot-av">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white" opacity="0.9"/></svg>
      </div>
      <div class="bubble">${item.a}</div>
    </div>
  `;
  chatScroll.appendChild(pair);
  pairs.push(pair);
});

function updateFocusStyles(activeIndex){
  pairs.forEach((pair, i) => {
    pair.classList.remove('center', 'near');
    const dist = Math.abs(i - activeIndex);
    if(dist === 0){
      pair.classList.add('center');
    } else if(dist === 1){
      pair.classList.add('near');
    }
  });
}

function selectQuestion(index){
  const items = [...document.querySelectorAll('.q-item')];
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const wasActive = items[index] && items[index].classList.contains('active');

  items.forEach((el, i) => {
    el.classList.toggle('active', i === index && !(isMobile && wasActive));
  });

  if(isMobile) return;

  updateFocusStyles(index);
  const target = pairs[index];
  const panel = chatScroll.parentElement;
  const targetOffset = target.offsetTop - (panel.clientHeight / 2) + (target.clientHeight / 2);
  chatScroll.scrollTo({ top: targetOffset, behavior: 'smooth' });
}

const chatPanel = document.querySelector('.chat-panel');

function syncChatHeight(){
  if(window.matchMedia('(max-width: 900px)').matches) return;
  const h = questionsEl.offsetHeight;
  if(h > 0){
    chatPanel.style.height = h + 'px';
  }
}

// init: desktop uses chat; mobile starts with all accordion items closed
syncChatHeight();
if(!window.matchMedia('(max-width: 900px)').matches){ selectQuestion(0); }

// keep heights + centering correct on resize
window.addEventListener('resize', () => {
  syncChatHeight();
  updateProcessStep();
  const activeIndex = [...document.querySelectorAll('.q-item')].findIndex(el => el.classList.contains('active'));
  if(activeIndex >= 0 && !window.matchMedia('(max-width: 900px)').matches) selectQuestion(activeIndex);
});
