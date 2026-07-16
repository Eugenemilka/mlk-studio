import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// ---------------------------------------------------------------------------
// Viewport state.
// stableVh is intentionally NOT updated on height-only resizes: mobile Safari
// toggles the address bar while scrolling and we must not re-layout for that.
// ---------------------------------------------------------------------------
const MOBILE_BREAKPOINT = 800;
const mqMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
const pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let viewportWidth = window.innerWidth;
let stableVh = window.innerHeight;

// ---------------------------------------------------------------------------
// Custom cursor (pointer devices only — on touch the elements are hidden)
// ---------------------------------------------------------------------------
const cursorDot = document.querySelector('.cursor-dot');
const cursorEllipse = document.querySelector('.cursor-ellipse');
const cursorLabel = document.querySelector('.cursor-label');

if (pointerFine && cursorDot && cursorEllipse) {
  const cursorCurrent = { x: 0, y: 0 };
  const ellipseTarget = { x: 0, y: 0 };
  const ellipseCurrent = { x: 0, y: 0 };

  window.addEventListener('pointermove', (event) => {
    cursorCurrent.x = event.clientX;
    cursorCurrent.y = event.clientY;
    ellipseTarget.x = event.clientX;
    ellipseTarget.y = event.clientY;
  });

  document.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('is-interactive'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('is-interactive'));
  });

  window.addEventListener('pointerdown', () => {
    cursorDot.style.transform = 'translate(-50%, -50%) scale(0.9)';
    cursorEllipse.style.transform = 'translate(-50%, -50%) scale(0.95)';
  });
  window.addEventListener('pointerup', () => {
    cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
    cursorEllipse.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  const animateCursor = () => {
    ellipseCurrent.x += (ellipseTarget.x - ellipseCurrent.x) * 0.12;
    ellipseCurrent.y += (ellipseTarget.y - ellipseCurrent.y) * 0.12;
    cursorDot.style.left = `${cursorCurrent.x}px`;
    cursorDot.style.top = `${cursorCurrent.y}px`;
    cursorEllipse.style.left = `${ellipseCurrent.x}px`;
    cursorEllipse.style.top = `${ellipseCurrent.y}px`;
    if (cursorLabel) {
      cursorLabel.style.left = `${cursorCurrent.x}px`;
      cursorLabel.style.top = `${cursorCurrent.y}px`;
    }
    requestAnimationFrame(animateCursor);
  };
  animateCursor();
}

// ---------------------------------------------------------------------------
// "Start your project": DVD screensaver + follow-the-cursor inside .sp-box
// ---------------------------------------------------------------------------
const spBox = document.querySelector('.sp-box');
const projectBtn = spBox?.querySelector('.btn');

if (spBox && projectBtn) {
  const dvdMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  // On mobile the button is static, centered, with no pointer interaction
  const dvdStatic = () => dvdMotionQuery.matches || mqMobile.matches;
  const DVD_SPEED = 1.75 / 3;
  const FOLLOW_LERP = 0.15;
  const position = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const velocity = { x: DVD_SPEED, y: DVD_SPEED };
  const bounds = { maxX: 0, maxY: 0, buttonWidth: 0, buttonHeight: 0 };
  let isFollowing = false;
  let isMeasured = false;
  let dvdFrameId = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const renderProjectButton = () => {
    projectBtn.style.transform = `translate3d(${position.x.toFixed(2)}px, ${position.y.toFixed(2)}px, 0)`;
  };

  const seedDvdVelocity = () => {
    velocity.x = (Math.random() < 0.5 ? -1 : 1) * DVD_SPEED;
    velocity.y = (Math.random() < 0.5 ? -1 : 1) * DVD_SPEED;
  };

  const measureDvdBounds = () => {
    const boxRect = spBox.getBoundingClientRect();
    const buttonRect = projectBtn.getBoundingClientRect();
    bounds.buttonWidth = buttonRect.width;
    bounds.buttonHeight = buttonRect.height;
    bounds.maxX = Math.max(0, boxRect.width - buttonRect.width);
    bounds.maxY = Math.max(0, boxRect.height - buttonRect.height);

    if (!isMeasured || dvdStatic()) {
      position.x = bounds.maxX / 2;
      position.y = bounds.maxY / 2;
      isMeasured = true;
    } else {
      position.x = clamp(position.x, 0, bounds.maxX);
      position.y = clamp(position.y, 0, bounds.maxY);
    }

    target.x = clamp(target.x, 0, bounds.maxX);
    target.y = clamp(target.y, 0, bounds.maxY);
    renderProjectButton();
  };

  const updateFollowTarget = (event) => {
    const boxRect = spBox.getBoundingClientRect();
    target.x = clamp(event.clientX - boxRect.left - bounds.buttonWidth / 2, 0, bounds.maxX);
    target.y = clamp(event.clientY - boxRect.top - bounds.buttonHeight / 2, 0, bounds.maxY);
  };

  const moveOnAxis = (axis, maxKey) => {
    const max = bounds[maxKey];
    if (max <= 0) {
      position[axis] = 0;
      return;
    }
    position[axis] += velocity[axis];
    if (position[axis] <= 0) {
      position[axis] = 0;
      velocity[axis] = Math.abs(velocity[axis]);
    } else if (position[axis] >= max) {
      position[axis] = max;
      velocity[axis] = -Math.abs(velocity[axis]);
    }
  };

  const dvdTick = () => {
    if (isFollowing) {
      position.x += (target.x - position.x) * FOLLOW_LERP;
      position.y += (target.y - position.y) * FOLLOW_LERP;
    } else {
      moveOnAxis('x', 'maxX');
      moveOnAxis('y', 'maxY');
    }
    renderProjectButton();
    dvdFrameId = requestAnimationFrame(dvdTick);
  };

  const startDvdAnimation = () => {
    if (dvdStatic() || dvdFrameId) return;
    dvdFrameId = requestAnimationFrame(dvdTick);
  };

  const stopDvdAnimation = () => {
    cancelAnimationFrame(dvdFrameId);
    dvdFrameId = 0;
  };

  spBox.addEventListener('pointerenter', (event) => {
    if (mqMobile.matches) return;
    document.body.classList.add('cursor-hide');
    if (dvdMotionQuery.matches) return;
    isFollowing = true;
    updateFollowTarget(event);
  });

  spBox.addEventListener('pointermove', (event) => {
    if (!isFollowing || dvdStatic()) return;
    updateFollowTarget(event);
  });

  spBox.addEventListener('pointerleave', () => {
    if (mqMobile.matches) return;
    document.body.classList.remove('cursor-hide');
    isFollowing = false;
    if (Math.hypot(velocity.x, velocity.y) < 0.1) {
      seedDvdVelocity();
    }
  });

  const syncDvdMode = () => {
    isFollowing = false;
    document.body.classList.remove('cursor-hide');
    measureDvdBounds();
    if (dvdStatic()) {
      stopDvdAnimation();
    } else {
      if (Math.hypot(velocity.x, velocity.y) < 0.1) seedDvdVelocity();
      startDvdAnimation();
    }
  };

  dvdMotionQuery.addEventListener('change', syncDvdMode);
  mqMobile.addEventListener('change', syncDvdMode);

  new ResizeObserver(measureDvdBounds).observe(spBox);
  (document.fonts?.ready || Promise.resolve()).then(measureDvdBounds);

  measureDvdBounds();
  if (!dvdStatic()) {
    seedDvdVelocity();
    startDvdAnimation();
  }
}

// ---------------------------------------------------------------------------
// Preloader + stair-step reveal.
// The white stair screen acts as the preloader: it stays until the site is
// fully loaded (fonts, hero textures, window load), showing the percentage
// bottom-right. Only then the stairs open and content animations follow.
// ---------------------------------------------------------------------------
const stairReveal = document.querySelector('.stair-reveal');
const preloaderCount = stairReveal?.querySelector('.stair-reveal__count');

const forceThemeColor = () => {
  let meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', '#0b0b0c');
  requestAnimationFrame(() => meta.setAttribute('content', '#0b0b0b'));
};

forceThemeColor();

const LOAD_UNITS = { fonts: 20, tex0: 20, tex1: 20, tex2: 20, page: 20 };
const loadedUnits = new Set();
let loadProgressTarget = 0;

const markLoaded = (key) => {
  if (!(key in LOAD_UNITS) || loadedUnits.has(key)) return;
  loadedUnits.add(key);
  let total = 0;
  loadedUnits.forEach((k) => {
    total += LOAD_UNITS[k];
  });
  loadProgressTarget = total;
};

(document.fonts?.ready || Promise.resolve()).then(() => markLoaded('fonts'));
if (document.readyState === 'complete') {
  markLoaded('page');
} else {
  window.addEventListener('load', () => markLoaded('page'), { once: true });
}
// Safety net: a failed resource must never trap the user on the preloader
setTimeout(() => Object.keys(LOAD_UNITS).forEach(markLoaded), 12000);

// Resolves when the displayed counter has smoothly reached 100%
const siteReady = new Promise((resolve) => {
  let displayed = 0;
  let shownPercent = -1;
  const tick = () => {
    displayed += (loadProgressTarget - displayed) * 0.14;
    if (loadProgressTarget >= 100 && displayed > 99.2) displayed = 100;
    const percent = Math.round(displayed);
    if (percent !== shownPercent && preloaderCount) {
      shownPercent = percent;
      preloaderCount.textContent = `${percent}%`;
    }
    if (displayed >= 100) {
      resolve();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

const stairRevealDone = new Promise((resolve) => {
  if (!stairReveal || prefersReducedMotion || mqMobile.matches) {
    stairReveal?.remove();
    forceThemeColor();
    resolve();
    return;
  }

  siteReady.then(() => {
    setTimeout(() => {
      stairReveal.classList.add('is-open');
      // Content starts animating while the back layer is still clearing
      setTimeout(resolve, 700);
      // Last back step: 0.16s layer delay + 7 * 0.055s stagger + 0.75s duration
      setTimeout(() => {
        stairReveal.remove();
        forceThemeColor();
      }, 1500);
    }, 200);
  });
});

// ---------------------------------------------------------------------------
// Per-character reveal (blur + slide), capped to 2s total per element
// ---------------------------------------------------------------------------
const REVEAL_MAX_TOTAL_SECONDS = 2;

function getRevealCssSeconds(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function splitReveal(el) {
  if (el.dataset.revealReady === 'true') return;

  const baseDelay = parseFloat(el.dataset.revealDelay || '0') || 0;
  const duration = getRevealCssSeconds('--reveal-duration', 0.8);
  const charCount = (el.textContent || '').replace(/\s+/g, '').length;
  // Cap the stagger so the whole element (delay + stagger + duration) fits the budget
  const staggerBudget = Math.max(0, REVEAL_MAX_TOTAL_SECONDS - baseDelay - duration);
  const stagger = Math.min(
    getRevealCssSeconds('--reveal-stagger', 0.03),
    charCount > 1 ? staggerBudget / (charCount - 1) : staggerBudget,
  );
  const fragment = document.createDocumentFragment();
  const nodes = Array.from(el.childNodes);
  let index = 0;

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = (node.textContent || '').split(/(\s+)/);
      parts.forEach((part) => {
        if (!part) return;
        if (/\s/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
        } else {
          const word = document.createElement('span');
          word.className = 'word';
          [...part].forEach((char) => {
            const letter = document.createElement('span');
            letter.className = 'char';
            letter.textContent = char;
            letter.style.transitionDelay = `${baseDelay + index++ * stagger}s`;
            word.appendChild(letter);
          });
          fragment.appendChild(word);
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
      fragment.appendChild(node.cloneNode(false));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      fragment.appendChild(node.cloneNode(true));
    }
  });

  el.textContent = '';
  el.appendChild(fragment);
  el.dataset.revealReady = 'true';
}

function setupReveal(el) {
  splitReveal(el);

  const run = () => {
    if (el.dataset.revealTriggered === 'true') return;
    el.dataset.revealTriggered = 'true';
    el.classList.add('is-visible');
  };

  if (prefersReducedMotion) {
    run();
    return;
  }

  if (el.dataset.revealOn === 'load') {
    stairRevealDone.then(run);
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run();
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    observer.observe(el);
  }
}

function setupFadeIn() {
  const elements = Array.from(document.querySelectorAll('[data-fade]'));
  elements.forEach((el, index) => {
    el.style.transitionDelay = `${index * 0.06}s`;
    if (prefersReducedMotion) {
      el.classList.add('is-in');
    }
  });

  if (prefersReducedMotion) return;

  stairRevealDone.then(() => {
    requestAnimationFrame(() => {
      elements.forEach((el) => el.classList.add('is-in'));
    });
  });
}

document.querySelectorAll('[data-reveal]').forEach(setupReveal);
setupFadeIn();

// ---------------------------------------------------------------------------
// Hero h1: scramble-on-hover per character
// ---------------------------------------------------------------------------
const heroRevealTitle = document.querySelector('.hero h1[data-reveal]');

if (heroRevealTitle && pointerFine) {
  const scrambleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@/\\<>*';
  const scrambleDuration = 600;
  const scrambleInterval = 45;
  const activeScrambles = new Map();
  const scrambleMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const stopScramble = (char) => {
    const timers = activeScrambles.get(char);
    if (timers) {
      clearInterval(timers.intervalId);
      clearTimeout(timers.timeoutId);
      activeScrambles.delete(char);
    }

    if (char.dataset.original !== undefined) {
      char.textContent = char.dataset.original;
    }
    char.classList.remove('is-scrambling');
    char.style.removeProperty('--scramble-char-width');
  };

  const startScramble = (char) => {
    if (scrambleMotionQuery.matches || !char.textContent || /^\s+$/.test(char.textContent)) return;

    if (char.dataset.original === undefined) {
      char.dataset.original = char.textContent;
    }

    stopScramble(char);
    char.style.setProperty('--scramble-char-width', `${char.getBoundingClientRect().width}px`);
    char.classList.add('is-scrambling');
    const useLowercase = /^[a-z]$/.test(char.dataset.original);

    const updateCharacter = () => {
      const randomIndex = Math.floor(Math.random() * scrambleCharacters.length);
      const randomCharacter = scrambleCharacters[randomIndex];
      char.textContent = useLowercase ? randomCharacter.toLowerCase() : randomCharacter;
    };

    updateCharacter();
    const intervalId = setInterval(updateCharacter, scrambleInterval);
    const timeoutId = setTimeout(() => stopScramble(char), scrambleDuration);
    activeScrambles.set(char, { intervalId, timeoutId });
  };

  heroRevealTitle.addEventListener('mouseover', (event) => {
    if (!(event.target instanceof HTMLElement) || !event.target.classList.contains('char')) return;
    startScramble(event.target);
  });

  heroRevealTitle.addEventListener('mouseout', (event) => {
    if (!(event.target instanceof HTMLElement) || !event.target.classList.contains('char')) return;
    stopScramble(event.target);
  });

  scrambleMotionQuery.addEventListener('change', (event) => {
    if (!event.matches) return;
    [...activeScrambles.keys()].forEach(stopScramble);
  });
}

// ---------------------------------------------------------------------------
// WebGL hero background (three.js)
// ---------------------------------------------------------------------------
const heroSection = document.querySelector('.hero');

const rendererPixelRatio = () => Math.min(window.devicePixelRatio || 1, mqMobile.matches ? 1.5 : 2);
const rendererHeight = () => Math.max(1, Math.round(stableVh * (mqMobile.matches ? 0.5 : 1)));
const initialRendererHeight = rendererHeight();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(rendererPixelRatio());
renderer.setSize(viewportWidth, initialRendererHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x0b0b0b, 1);
heroSection.prepend(renderer.domElement);
renderer.domElement.id = 'hero-canvas';
const heroCanvas = renderer.domElement;

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
camera.position.z = 1;

const scene = new THREE.Scene();
const geometry = new THREE.PlaneGeometry(2.08, 2.08);
const uniforms = {
  uTexture: { value: null },
  uDisplacement: { value: null },
  uFlowMap: { value: null },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  uMouseInfluence: { value: 0.0 },
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(viewportWidth, initialRendererHeight) },
  uImageResolution: { value: new THREE.Vector2(1, 1) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform sampler2D uDisplacement;
    uniform sampler2D uFlowMap;
    uniform vec2 uMouse;
    uniform float uMouseInfluence;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uImageResolution;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      vec2 ambient = texture2D(uDisplacement, uv * 1.18 + vec2(uTime * 0.012, uTime * 0.008)).rg - 0.5;
      uv += ambient * 0.012;

      vec2 flow = texture2D(uFlowMap, uv * 1.1 + vec2(uTime * 0.008, -uTime * 0.005)).rg - 0.5;
      uv += flow * 0.0065 * (0.45 + uMouseInfluence * 0.25);

      vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
      vec2 p = uv * aspect;
      vec2 m = uMouse * aspect;
      float d = distance(p, m);
      float ripple = smoothstep(0.52, 0.0, d);
      vec2 disp = texture2D(uDisplacement, uv + vec2(uTime * 0.028, -uTime * 0.018)).rg - 0.5;
      uv += disp * ripple * 0.09 * (0.75 + uMouseInfluence * 0.3);

      // "cover" fit: keep the image aspect, center horizontally, never squeeze
      vec2 s = uResolution / uImageResolution;
      float scale = max(s.x, s.y);
      vec2 size = uImageResolution * scale;
      vec2 offset = (uResolution - size) * 0.5;
      vec2 coverUv = (uv * uResolution - offset) / size;

      gl_FragColor = texture2D(uTexture, coverUv);
    }
  `,
});

scene.add(new THREE.Mesh(geometry, material));

const textureLoader = new THREE.TextureLoader();
const texturePaths = ['assets/header-1.png?v=20260716-1', 'assets/heightMap.png', 'assets/map-9.jpg'];

const loadTexture = (path) =>
  new Promise((resolve, reject) => {
    textureLoader.load(
      path,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });

const targetMouse = { x: 0.5, y: 0.5 };
const smoothedMouse = { x: 0.5, y: 0.5 };
let influence = 0.0;
let activePointer = false;

if (pointerFine) {
  window.addEventListener('pointermove', (event) => {
    targetMouse.x = event.clientX / viewportWidth;
    targetMouse.y = 1 - event.clientY / stableVh;
    activePointer = true;
    influence = 1.0;
  });

  window.addEventListener('pointerleave', () => {
    activePointer = false;
  });
}

// Mobile: the hero scrolls out of view natively — stop rendering once it's gone
let heroInView = true;
let webglReady = false;

new IntersectionObserver(([entry]) => {
  heroInView = entry.isIntersecting;
}).observe(heroSection);

Promise.all(
  texturePaths.map((path, i) =>
    loadTexture(path).then((texture) => {
      markLoaded(`tex${i}`);
      return texture;
    }),
  ),
).then(([texture, displacement, flowMap]) => {
  uniforms.uTexture.value = texture;
  uniforms.uDisplacement.value = displacement;
  uniforms.uFlowMap.value = flowMap;
  uniforms.uImageResolution.value.set(texture.image.width, texture.image.height);
  webglReady = true;
  requestAnimationFrame(renderLoop);
});

const renderLoop = () => {
  if (!webglReady) return;
  requestAnimationFrame(renderLoop);
  if (!heroInView) return;

  smoothedMouse.x += (targetMouse.x - smoothedMouse.x) * 0.06;
  smoothedMouse.y += (targetMouse.y - smoothedMouse.y) * 0.06;

  if (activePointer) {
    influence += (1 - influence) * 0.16;
  } else {
    influence *= 0.94;
  }

  uniforms.uMouse.value.set(smoothedMouse.x, smoothedMouse.y);
  uniforms.uMouseInfluence.value = influence;
  uniforms.uTime.value += 0.016;

  renderer.render(scene, camera);
};

// ---------------------------------------------------------------------------
// Scroll pipeline. ONE consumer per frame; every style write is cached and
// skipped when the value did not actually change (no layout/paint for free).
// ---------------------------------------------------------------------------
const aboutSection = document.querySelector('.about');
const aboutSticky = document.querySelector('.about-sticky');
const siteHeader = document.querySelector('.site-header');
const serviceEls = Array.from(document.querySelectorAll('.service'));
const bodyWraps = serviceEls.map((el) => el.querySelector('.service-body-wrap'));

let currentScroll = 0;
let cachedPinStart = stableVh; // scroll position where the accordion pins
let cachedPinDistance = 0;     // scroll distance that drives the full collapse

let bodyHeights = bodyWraps.map(() => 0);
const lastWrapHeights = bodyWraps.map(() => -1);
const lastWrapOpacities = bodyWraps.map(() => -1);
const lastCollapsed = bodyWraps.map(() => false);

const updateServicesCollapse = (y) => {
  if (cachedPinDistance <= 0) return;

  const progress = Math.min(1, Math.max(0, (y - cachedPinStart) / cachedPinDistance));
  for (let i = 0; i < serviceEls.length; i++) {
    const local = Math.min(1, Math.max(0, progress * serviceEls.length - i));
    const height = Math.round(bodyHeights[i] * (1 - local));
    const opacity = Math.round((1 - local) * 100) / 100;
    const collapsed = local >= 1;

    if (height !== lastWrapHeights[i]) {
      lastWrapHeights[i] = height;
      bodyWraps[i].style.height = `${height}px`;
    }
    if (opacity !== lastWrapOpacities[i]) {
      lastWrapOpacities[i] = opacity;
      bodyWraps[i].style.opacity = opacity;
    }
    if (collapsed !== lastCollapsed[i]) {
      lastCollapsed[i] = collapsed;
      serviceEls[i].classList.toggle('is-collapsed', collapsed);
    }
  }
};

const updateScrollAnimations = (scroll) => {
  currentScroll = scroll;
  updateServicesCollapse(scroll);
};

// ---------------------------------------------------------------------------
// Services: measurement + pin geometry.
// The .about height is computed here so that the accordion is ALWAYS fully
// collapsed while the stage is still pinned (any viewport size), and only
// then the page continues scrolling.
// ---------------------------------------------------------------------------
const COLLAPSE_VH_PER_ITEM = 0.45;
const PIN_END_BUFFER = 160;

const measureServices = () => {
  if (!aboutSection || !aboutSticky || !serviceEls.length) return;

  // -- writes: unlock natural heights
  bodyWraps.forEach((wrap) => {
    wrap.style.height = 'auto';
  });

  // -- reads (single layout pass)
  bodyHeights = bodyWraps.map((wrap) => wrap.scrollHeight);
  const totalBody = bodyHeights.reduce((sum, h) => sum + h, 0);
  const expandedStageHeight = aboutSticky.offsetHeight;
  const aboutTop = aboutSection.offsetTop;
  const headerBottom = siteHeader ? siteHeader.getBoundingClientRect().bottom : 0;
  const firstServiceTop =
    serviceEls[0].getBoundingClientRect().top - aboutSticky.getBoundingClientRect().top;

  // -- compute
  // Pin the stage above the viewport so the first service stops 30px below
  // the fixed header the moment the accordion starts collapsing.
  const pinShift = Math.max(0, Math.round(firstServiceTop - headerBottom - 30));
  const collapsedStageHeight = Math.max(stableVh, expandedStageHeight - totalBody);
  const collapseDistance = Math.round(stableVh * COLLAPSE_VH_PER_ITEM * serviceEls.length);
  // Section height that keeps the stage pinned until progress reaches 1
  const aboutHeight = collapseDistance + collapsedStageHeight + pinShift + PIN_END_BUFFER;

  cachedPinStart = aboutTop + pinShift;
  cachedPinDistance = collapseDistance;

  // -- writes
  aboutSticky.style.top = `${-pinShift}px`;
  aboutSection.style.height = `${aboutHeight}px`;
  lastWrapHeights.fill(-1);
  lastWrapOpacities.fill(-1);
  updateServicesCollapse(currentScroll);
};

if (serviceEls.length) {
  if (prefersReducedMotion) {
    serviceEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const serviceObserver = new IntersectionObserver((entries, obs) => {
      const incoming = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => serviceEls.indexOf(a.target) - serviceEls.indexOf(b.target));
      incoming.forEach((entry, batchIndex) => {
        setTimeout(() => entry.target.classList.add('is-in'), batchIndex * 130);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.25 });
    serviceEls.forEach((el) => serviceObserver.observe(el));
  }

  if (pointerFine) {
    serviceEls.forEach((el) => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-more'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-more'));
    });
  }
}

// ---------------------------------------------------------------------------
// Scroll source: native scrolling on every viewport, rAF-throttled so all
// scroll-dependent effects are still written together once per frame.
// ---------------------------------------------------------------------------
let nativeScrollScheduled = false;

const onNativeScroll = () => {
  if (nativeScrollScheduled) return;
  nativeScrollScheduled = true;
  requestAnimationFrame(() => {
    nativeScrollScheduled = false;
    updateScrollAnimations(window.scrollY);
  });
};

window.addEventListener('scroll', onNativeScroll, { passive: true });

// ---------------------------------------------------------------------------
// Resize: react to WIDTH changes and orientation only. Height-only resizes
// (mobile Safari address bar) never trigger re-layout or re-measure.
// ---------------------------------------------------------------------------
let viewportRefreshFrame = 0;

const applyViewport = () => {
  viewportWidth = window.innerWidth;
  stableVh = window.innerHeight;
  const canvasHeight = rendererHeight();
  renderer.setPixelRatio(rendererPixelRatio());
  renderer.setSize(viewportWidth, canvasHeight, false);
  uniforms.uResolution.value.set(viewportWidth, canvasHeight);
  measureServices();
};

const scheduleViewportRefresh = () => {
  cancelAnimationFrame(viewportRefreshFrame);
  viewportRefreshFrame = requestAnimationFrame(applyViewport);
};

window.addEventListener('resize', () => {
  if (window.innerWidth === viewportWidth) return;
  scheduleViewportRefresh();
});
window.addEventListener('orientationchange', scheduleViewportRefresh);
mqMobile.addEventListener('change', scheduleViewportRefresh);

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
measureServices();
(document.fonts?.ready || Promise.resolve()).then(measureServices);
updateScrollAnimations(window.scrollY);
