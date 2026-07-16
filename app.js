import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import Lenis from 'https://unpkg.com/lenis@1.3.4/dist/lenis.mjs';
import Matter from 'https://esm.sh/matter-js@0.20.0';

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
// Services: natural-height sticky stack. No scroll-driven layout writes.
// ---------------------------------------------------------------------------
const aboutSection = document.querySelector('.about');
const serviceEls = Array.from(document.querySelectorAll('.service'));

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

}

// ---------------------------------------------------------------------------
// Service tags: isolated Matter.js worlds with one shared, sleep-aware rAF.
// ---------------------------------------------------------------------------
const serviceTagContainers = Array.from(document.querySelectorAll('.service-tags'));

if (serviceTagContainers.length) {
  if (prefersReducedMotion) {
    serviceTagContainers.forEach((container) => container.classList.add('is-static'));
  } else {
    const { Engine, Bodies, Body, Composite, Sleeping } = Matter;
    const TAG_CEILING_CATEGORY = 0x0002;
    const TAG_MASK_WITHOUT_CEILING = 0xfffffffd;
    const activeTagPhysics = new Set();
    const tagPhysicsStates = serviceTagContainers.map((container) => ({
      container,
      service: container.closest('.service'),
      chips: Array.from(container.querySelectorAll('.tag')),
      engine: Engine.create({ enableSleeping: true }),
      records: [],
      boundaries: [],
      width: 0,
      height: 0,
      ceilingY: 0,
      ready: false,
      startRequested: false,
      started: false,
      spawnedCount: 0,
      pointer: { active: false, x: 0, y: 0 },
    }));

    let aboutPhysicsVisible = false;
    let tagPhysicsFrame = 0;
    let previousPhysicsTime = 0;

    tagPhysicsStates.forEach((state) => {
      state.engine.gravity.y = 1;
    });

    const canRunTagPhysics = (state) =>
      state.ready &&
      state.started &&
      state.spawnedCount > 0 &&
      aboutPhysicsVisible;

    const renderTagRecord = (record) => {
      const { position, angle } = record.body;
      record.element.style.transform =
        `translate3d(${position.x - record.width / 2}px, ${position.y - record.height / 2}px, 0) ` +
        `rotate(${angle}rad)`;
    };

    const enforceTagCeiling = (state, record) => {
      const topLimit = state.ceilingY + record.height / 2;

      if (!record.ceilingEnabled && record.body.position.y >= topLimit) {
        record.ceilingEnabled = true;
        record.body.collisionFilter.mask = 0xffffffff;
      }

      if (record.ceilingEnabled && record.body.position.y < topLimit) {
        Body.setPosition(record.body, {
          x: record.body.position.x,
          y: topLimit,
        });
        Body.setVelocity(record.body, {
          x: record.body.velocity.x,
          y: Math.abs(record.body.velocity.y) * 0.25,
        });
      }
    };

    const renderTagState = (state) => {
      state.records.forEach((record) => {
        if (!record.spawned) return;
        enforceTagCeiling(state, record);
        renderTagRecord(record);
      });
    };

    const repelTagsFromPointer = (state) => {
      if (!state.pointer.active) return;
      const radius = 160;

      state.records.forEach((record) => {
        if (!record.spawned) return;
        let dx = record.body.position.x - state.pointer.x;
        let dy = record.body.position.y - state.pointer.y;
        let distance = Math.hypot(dx, dy);
        if (distance >= radius) return;
        if (distance < 0.001) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          distance = Math.hypot(dx, dy) || 1;
        }

        const proximity = 1 - distance / radius;
        const force = 0.006 * record.body.mass * proximity;
        Sleeping.set(record.body, false);
        Body.applyForce(record.body, record.body.position, {
          x: (dx / distance) * force,
          y: (dy / distance) * force,
        });
      });
    };

    const runTagPhysics = (time) => {
      tagPhysicsFrame = 0;
      const delta = previousPhysicsTime
        ? Math.min(1000 / 30, Math.max(1000 / 120, time - previousPhysicsTime))
        : 1000 / 60;
      previousPhysicsTime = time;

      activeTagPhysics.forEach((state) => {
        if (!canRunTagPhysics(state)) {
          activeTagPhysics.delete(state);
          return;
        }

        repelTagsFromPointer(state);
        Engine.update(state.engine, delta);
        renderTagState(state);

        const allSpawned = state.spawnedCount === state.records.length;
        const allSleeping = allSpawned && state.records.every(({ body }) => body.isSleeping);
        if (allSleeping) activeTagPhysics.delete(state);
      });

      if (activeTagPhysics.size) {
        tagPhysicsFrame = requestAnimationFrame(runTagPhysics);
      } else {
        previousPhysicsTime = 0;
      }
    };

    const activateTagPhysics = (state) => {
      if (!canRunTagPhysics(state)) return;
      activeTagPhysics.add(state);
      if (!tagPhysicsFrame) tagPhysicsFrame = requestAnimationFrame(runTagPhysics);
    };

    const rebuildTagBoundaries = (state) => {
      state.boundaries.forEach((boundary) => Composite.remove(state.engine.world, boundary));

      const thickness = 80;
      const wallHeight = state.height + 400;
      const wallY = state.height / 2 - 100;
      state.boundaries = [
        Bodies.rectangle(
          state.width / 2,
          state.ceilingY - thickness / 2,
          state.width + thickness * 2,
          thickness,
          {
            isStatic: true,
            collisionFilter: { category: TAG_CEILING_CATEGORY },
          },
        ),
        Bodies.rectangle(
          state.width / 2,
          state.height + thickness / 2,
          state.width + thickness * 2,
          thickness,
          { isStatic: true },
        ),
        Bodies.rectangle(-thickness / 2, wallY, thickness, wallHeight, { isStatic: true }),
        Bodies.rectangle(
          state.width + thickness / 2,
          wallY,
          thickness,
          wallHeight,
          { isStatic: true },
        ),
      ];
      Composite.add(state.engine.world, state.boundaries);
    };

    const resizeTagPhysics = (state) => {
      if (!state.ready) return;
      const rect = state.container.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      state.width = rect.width;
      state.height = rect.height;
      const titleRect = state.service?.querySelector('.service-title')?.getBoundingClientRect();
      state.ceilingY = titleRect ? Math.min(0, titleRect.top - rect.top) : 0;
      state.container.style.setProperty('--tag-ceiling-y', `${state.ceilingY}px`);
      rebuildTagBoundaries(state);

      state.records.forEach((record) => {
        if (!record.spawned) return;
        const minX = Math.min(record.width / 2, state.width / 2);
        const maxX = Math.max(minX, state.width - record.width / 2);
        const minY = Math.min(record.height / 2, state.height / 2);
        const maxY = Math.max(minY, state.height - record.height / 2);
        Body.setPosition(record.body, {
          x: Math.min(maxX, Math.max(minX, record.body.position.x)),
          y: Math.min(maxY, Math.max(minY, record.body.position.y)),
        });
        enforceTagCeiling(state, record);
        Sleeping.set(record.body, false);
        renderTagRecord(record);
      });

      activateTagPhysics(state);
    };

    const spawnTag = (state, record) => {
      if (record.spawned) return;
      const minX = Math.min(record.width / 2, state.width / 2);
      const maxX = Math.max(minX, state.width - record.width / 2);
      const spawnX = minX + Math.random() * (maxX - minX);
      const spawnY = state.ceilingY - (60 + Math.random() * 100);

      Body.setPosition(record.body, { x: spawnX, y: spawnY });
      Body.setAngle(record.body, (Math.random() - 0.5) * 0.4);
      Body.setAngularVelocity(record.body, (Math.random() - 0.5) * 0.05);
      Composite.add(state.engine.world, record.body);
      record.spawned = true;
      state.spawnedCount += 1;
      record.element.style.opacity = '1';
      renderTagRecord(record);
      activateTagPhysics(state);
    };

    const startTagCascade = (state) => {
      state.startRequested = true;
      if (!state.ready || state.started) return;
      state.started = true;
      state.records.forEach((record, index) => {
        window.setTimeout(() => spawnTag(state, record), index * 90);
      });
    };

    const initializeTagPhysics = (state) => {
      state.records = state.chips.map((element) => {
        const rect = element.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const body = Bodies.rectangle(0, 0, width, height, {
          chamfer: { radius: height / 2 },
          restitution: 0.2,
          friction: 0.3,
          frictionAir: 0.015,
          collisionFilter: {
            category: 0x0001,
            mask: TAG_MASK_WITHOUT_CEILING,
          },
        });
        return { element, body, width, height, spawned: false, ceilingEnabled: false };
      });
      state.ready = true;
      resizeTagPhysics(state);
      if (state.startRequested) startTagCascade(state);
    };

    const servicePhysicsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const state = tagPhysicsStates.find(({ service }) => service === entry.target);
        if (state) startTagCascade(state);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    tagPhysicsStates.forEach((state) => {
      if (state.service) servicePhysicsObserver.observe(state.service);

      const resizeObserver = new ResizeObserver(() => resizeTagPhysics(state));
      resizeObserver.observe(state.container);

      if (pointerFine) {
        const updateTagPointer = (event) => {
          const rect = state.container.getBoundingClientRect();
          state.pointer.active = true;
          state.pointer.x = event.clientX - rect.left;
          state.pointer.y = event.clientY - rect.top;
          activateTagPhysics(state);
        };

        state.container.addEventListener('pointerenter', updateTagPointer, { passive: true });
        state.container.addEventListener('pointermove', updateTagPointer, { passive: true });
        state.container.addEventListener('pointerleave', () => {
          state.pointer.active = false;
        });
      }
    });

    if (aboutSection) {
      const aboutPhysicsObserver = new IntersectionObserver(([entry]) => {
        aboutPhysicsVisible = entry.isIntersecting;
        if (aboutPhysicsVisible) {
          tagPhysicsStates.forEach(activateTagPhysics);
        } else {
          activeTagPhysics.clear();
        }
      });
      aboutPhysicsObserver.observe(aboutSection);
    }

    (document.fonts?.ready || Promise.resolve()).then(() => {
      tagPhysicsStates.forEach(initializeTagPhysics);
    });
  }
}

// ---------------------------------------------------------------------------
// Stats counter: one viewport observer, no scroll/resize listeners.
// ---------------------------------------------------------------------------
const statsSection = document.querySelector('.stats');
const statNums = Array.from(document.querySelectorAll('.stat-num[data-count-to]'));

const formatStatValue = (el, value) => {
  const suffix = el.dataset.suffix || '';
  return `${String(value).padStart(2, '0')}${suffix}`;
};

const resetStatValues = () => {
  statNums.forEach((el) => {
    el.textContent = formatStatValue(el, 0);
  });
};

const setFinalStatValues = () => {
  statNums.forEach((el) => {
    const target = Number.parseInt(el.dataset.countTo || '0', 10);
    el.textContent = formatStatValue(el, target);
  });
};

const animateStatValues = () => {
  const duration = 1800;
  let start = null;

  const tick = (now) => {
    if (start === null) start = now;

    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);

    statNums.forEach((el) => {
      const target = Number.parseInt(el.dataset.countTo || '0', 10);
      const value = Math.round(target * eased);
      el.textContent = formatStatValue(el, value);
    });

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      setFinalStatValues();
    }
  };

  requestAnimationFrame(tick);
};

if (statsSection && statNums.length) {
  if (prefersReducedMotion) {
    setFinalStatValues();
  } else {
    resetStatValues();
    const statsTrigger = statsSection.querySelector('.stat') || statsSection;
    let hasCounted = false;
    let statsObserver;

    const startStatsCounter = () => {
      if (hasCounted) return;
      hasCounted = true;
      animateStatValues();
      statsObserver?.disconnect();
    };

    const startIfStatsAreVisible = () => {
      const rect = statsTrigger.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;
      if (rect.bottom > 0 && rect.top < viewportHeight) startStatsCounter();
    };

    statsObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) startStatsCounter();
    }, { threshold: 0.01 });

    statsObserver.observe(statsTrigger);

    if (document.readyState === 'complete') {
      requestAnimationFrame(startIfStatsAreVisible);
    } else {
      window.addEventListener('load', () => {
        requestAnimationFrame(startIfStatsAreVisible);
      }, { once: true });
    }
  }
}

// ---------------------------------------------------------------------------
// Selected work: arrows, horizontal wheel/trackpad and pointer dragging.
// ---------------------------------------------------------------------------
const worksSection = document.querySelector('.works');
const worksInner = worksSection?.querySelector('.works-inner');
const worksTitle = worksSection?.querySelector('.works-title');
const worksViewport = worksSection?.querySelector('.works-viewport');
const worksTrack = worksSection?.querySelector('.works-track');
const workCards = Array.from(worksSection?.querySelectorAll('.work-card') || []);
const worksPrev = worksSection?.querySelector('.works-arrow--prev');
const worksNext = worksSection?.querySelector('.works-arrow--next');

const WORK_CARD_WIDTH = 350;
const WORK_CARD_GAP = 15;
const WORK_SLIDE_STEP = WORK_CARD_WIDTH + WORK_CARD_GAP;
const WORK_END_INSET = 30;

let worksPosition = 0;
let worksMaxPosition = 0;
let worksStartOffset = 0;
let worksPointerId = null;
let worksDragStartX = 0;
let worksDragStartPosition = 0;
let worksDragMoved = false;
let suppressWorksClick = false;
let worksWheelEndTimer = 0;

const clampWorksPosition = (position) => (
  Math.min(worksMaxPosition, Math.max(0, position))
);

const renderWorksSlider = () => {
  if (!worksTrack) return;
  const offset = worksStartOffset - worksPosition;
  worksTrack.style.setProperty('--works-offset', `${offset}px`);

  if (worksPrev) worksPrev.disabled = worksPosition <= 0.5;
  if (worksNext) worksNext.disabled = worksPosition >= worksMaxPosition - 0.5;
};

const measureWorks = () => {
  if (!worksInner || !worksTitle || !worksViewport || !worksTrack || !workCards.length) return;

  const innerStyles = getComputedStyle(worksInner);
  worksStartOffset = mqMobile.matches
    ? Number.parseFloat(innerStyles.paddingLeft) || 0
    : worksTitle.getBoundingClientRect().left;

  const lastCard = workCards[workCards.length - 1];
  const lastCardRight = lastCard.offsetLeft + lastCard.offsetWidth;
  worksMaxPosition = Math.max(
    0,
    worksStartOffset + lastCardRight - worksViewport.clientWidth + WORK_END_INSET,
  );
  worksPosition = clampWorksPosition(worksPosition);
  renderWorksSlider();
};

worksPrev?.addEventListener('click', () => {
  worksPosition = clampWorksPosition(worksPosition - WORK_SLIDE_STEP);
  renderWorksSlider();
});

worksNext?.addEventListener('click', () => {
  worksPosition = clampWorksPosition(worksPosition + WORK_SLIDE_STEP);
  renderWorksSlider();
});

worksViewport?.addEventListener('wheel', (event) => {
  const hasHorizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
  if (!hasHorizontalIntent && !event.shiftKey) return;

  let delta = hasHorizontalIntent ? event.deltaX : event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= worksViewport.clientWidth;

  const nextPosition = clampWorksPosition(worksPosition + delta);
  if (nextPosition === worksPosition) return;

  event.preventDefault();
  event.stopPropagation();
  worksTrack?.classList.add('is-direct-manipulation');
  worksPosition = nextPosition;
  renderWorksSlider();

  window.clearTimeout(worksWheelEndTimer);
  worksWheelEndTimer = window.setTimeout(() => {
    worksTrack?.classList.remove('is-direct-manipulation');
  }, 100);
}, { passive: false });

worksViewport?.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

  window.clearTimeout(worksWheelEndTimer);
  worksPointerId = event.pointerId;
  worksDragStartX = event.clientX;
  worksDragStartPosition = worksPosition;
  worksDragMoved = false;
  worksViewport.setPointerCapture(event.pointerId);
});

worksViewport?.addEventListener('pointermove', (event) => {
  if (event.pointerId !== worksPointerId) return;

  const dragDistance = event.clientX - worksDragStartX;
  if (!worksDragMoved && Math.abs(dragDistance) < 3) return;

  worksDragMoved = true;
  worksTrack?.classList.add('is-direct-manipulation');
  worksViewport.classList.add('is-dragging');
  worksPosition = clampWorksPosition(worksDragStartPosition - dragDistance);
  renderWorksSlider();
});

const finishWorksDrag = (event) => {
  if (event.pointerId !== worksPointerId) return;

  if (worksViewport?.hasPointerCapture(event.pointerId)) {
    worksViewport.releasePointerCapture(event.pointerId);
  }

  suppressWorksClick = worksDragMoved;
  if (suppressWorksClick) {
    window.setTimeout(() => {
      suppressWorksClick = false;
    }, 0);
  }

  worksPointerId = null;
  worksDragMoved = false;
  worksViewport?.classList.remove('is-dragging');
  worksTrack?.classList.remove('is-direct-manipulation');
};

worksViewport?.addEventListener('pointerup', finishWorksDrag);
worksViewport?.addEventListener('pointercancel', finishWorksDrag);

worksViewport?.addEventListener('click', (event) => {
  if (!suppressWorksClick) return;
  event.preventDefault();
  event.stopPropagation();
}, true);

if (worksSection && workCards.length) {
  if (prefersReducedMotion) {
    workCards.forEach((card) => card.classList.add('is-in'));
  } else {
    const worksObserver = new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      workCards.forEach((card) => card.classList.add('is-in'));
      observer.unobserve(worksSection);
    }, { threshold: 0.2 });

    worksObserver.observe(worksSection);
  }
}

// ---------------------------------------------------------------------------
// MLK.STUDIO pixel grid: one responsive Canvas 2D surface. The static grid is
// redrawn only on resize; rAF runs while hovered or while residual heat fades.
// ---------------------------------------------------------------------------
const pixelsSection = document.querySelector('.pixels');
const pixelsCanvas = pixelsSection?.querySelector('.pixels-canvas');

if (pixelsSection && pixelsCanvas) {
  const PIXEL_SIZE = 16;
  const PIXEL_GAP = 4;
  const PIXEL_STEP = PIXEL_SIZE + PIXEL_GAP;
  const PIXEL_FADE_DURATION = 1000;
  const PIXEL_PATH_SAMPLE_STEP = 2;
  const PIXEL_LOGO = 'MLK.STUDIO';
  const PIXEL_LOGO_HEIGHT = 7;
  const PIXEL_LOGO_INSET_CELLS = 1;
  const GLYPHS = {
    M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    '.': ['00', '00', '00', '00', '00', '11', '11'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  };

  const logoCells = new Set();
  let logoWidth = 0;

  [...PIXEL_LOGO].forEach((character, characterIndex) => {
    const glyph = GLYPHS[character];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((value, colIndex) => {
        if (value === '1') logoCells.add(`${logoWidth + colIndex},${rowIndex}`);
      });
    });
    logoWidth += glyph[0].length;
    if (characterIndex < PIXEL_LOGO.length - 1) logoWidth += 1;
  });

  const parseHexColor = (value) => {
    const match = value.trim().match(/^#([\da-f]{6})$/i);
    if (!match) return { r: 255, g: 90, b: 31 };
    const number = Number.parseInt(match[1], 16);
    return {
      r: (number >> 16) & 255,
      g: (number >> 8) & 255,
      b: number & 255,
    };
  };

  const accent = parseHexColor(
    getComputedStyle(document.documentElement).getPropertyValue('--pixel-accent'),
  );
  const context = pixelsCanvas.getContext('2d', { alpha: true });
  const pointer = { active: false, hasPosition: false, x: 0, y: 0, cellIndex: -1 };
  let cssWidth = 0;
  let cssHeight = 0;
  let columns = 0;
  let rows = 0;
  let gridOffsetX = 0;
  let gridOffsetY = 0;
  let baseAlphas = new Float32Array(0);
  let heat = new Float32Array(0);
  let pixelsFrame = 0;
  let previousPixelsTime = 0;

  const isLogoCell = (col, row) => {
    const logoColumns = columns - PIXEL_LOGO_INSET_CELLS * 2;
    const logoRows = rows - PIXEL_LOGO_INSET_CELLS * 2;
    const logoCol = col - PIXEL_LOGO_INSET_CELLS;
    const logoRow = row - PIXEL_LOGO_INSET_CELLS;
    if (
      logoColumns <= 0 ||
      logoRows <= 0 ||
      logoCol < 0 ||
      logoCol >= logoColumns ||
      logoRow < 0 ||
      logoRow >= logoRows
    ) return false;

    const sourceCol = Math.min(
      logoWidth - 1,
      Math.floor((logoCol / logoColumns) * logoWidth),
    );
    const sourceRow = Math.min(
      PIXEL_LOGO_HEIGHT - 1,
      Math.floor((logoRow / logoRows) * PIXEL_LOGO_HEIGHT),
    );
    return logoCells.has(`${sourceCol},${sourceRow}`);
  };

  const pixelColor = (baseAlpha, factor) => {
    if (factor <= 0) return `rgba(255, 255, 255, ${baseAlpha})`;
    if (baseAlpha <= 0) {
      return `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${factor})`;
    }
    const red = Math.round(255 + (accent.r - 255) * factor);
    const green = Math.round(255 + (accent.g - 255) * factor);
    const blue = Math.round(255 + (accent.b - 255) * factor);
    const alpha = baseAlpha + (1 - baseAlpha) * factor;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  };

  const drawPixelGrid = (withHeat = false) => {
    if (!context || !cssWidth || !cssHeight) return;
    context.clearRect(0, 0, cssWidth, cssHeight);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const index = row * columns + col;
        context.fillStyle = pixelColor(baseAlphas[index], withHeat ? heat[index] : 0);
        context.fillRect(
          gridOffsetX + col * PIXEL_STEP,
          gridOffsetY + row * PIXEL_STEP,
          PIXEL_SIZE,
          PIXEL_SIZE,
        );
      }
    }
  };

  const getPixelCellIndex = (x, y) => {
    const localX = x - gridOffsetX;
    const localY = y - gridOffsetY;
    if (localX < 0 || localY < 0) return -1;

    const col = Math.floor(localX / PIXEL_STEP);
    const row = Math.floor(localY / PIXEL_STEP);
    if (col < 0 || col >= columns || row < 0 || row >= rows) return -1;
    if (localX - col * PIXEL_STEP >= PIXEL_SIZE) return -1;
    if (localY - row * PIXEL_STEP >= PIXEL_SIZE) return -1;
    return row * columns + col;
  };

  const heatPixelPath = (startX, startY, endX, endY) => {
    const distance = Math.hypot(endX - startX, endY - startY);
    const samples = Math.max(1, Math.ceil(distance / PIXEL_PATH_SAMPLE_STEP));

    for (let sample = 0; sample <= samples; sample += 1) {
      const progress = sample / samples;
      const index = getPixelCellIndex(
        startX + (endX - startX) * progress,
        startY + (endY - startY) * progress,
      );
      if (index >= 0) heat[index] = 1;
    }
  };

  const renderPixelsHeat = (time) => {
    pixelsFrame = 0;
    const delta = previousPixelsTime ? Math.max(0, time - previousPixelsTime) : 0;
    previousPixelsTime = time;
    const cooling = delta / PIXEL_FADE_DURATION;
    let maxHeat = 0;

    for (let index = 0; index < heat.length; index += 1) {
      if (pointer.active && index === pointer.cellIndex) {
        heat[index] = 1;
      } else if (heat[index] > 0) {
        heat[index] = Math.max(0, heat[index] - cooling);
      }
      if (heat[index] > maxHeat) maxHeat = heat[index];
    }

    drawPixelGrid(true);

    if (pointer.active || maxHeat > 0.001) {
      pixelsFrame = requestAnimationFrame(renderPixelsHeat);
    } else {
      heat.fill(0);
      previousPixelsTime = 0;
      drawPixelGrid(false);
    }
  };

  const startPixelsHeat = () => {
    if (!pixelsFrame) {
      previousPixelsTime = 0;
      pixelsFrame = requestAnimationFrame(renderPixelsHeat);
    }
  };

  const resizePixels = () => {
    const rect = pixelsCanvas.getBoundingClientRect();
    cssWidth = rect.width;
    cssHeight = rect.height;
    const dpr = window.devicePixelRatio || 1;

    pixelsCanvas.width = Math.max(1, Math.round(cssWidth * dpr));
    pixelsCanvas.height = Math.max(1, Math.round(cssHeight * dpr));
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);

    columns = Math.max(0, Math.floor((cssWidth + PIXEL_GAP) / PIXEL_STEP));
    rows = Math.max(0, Math.floor((cssHeight + PIXEL_GAP) / PIXEL_STEP));
    const gridWidth = columns > 0 ? columns * PIXEL_SIZE + (columns - 1) * PIXEL_GAP : 0;
    const gridHeight = rows > 0 ? rows * PIXEL_SIZE + (rows - 1) * PIXEL_GAP : 0;
    gridOffsetX = (cssWidth - gridWidth) / 2;
    gridOffsetY = (cssHeight - gridHeight) / 2;
    baseAlphas = new Float32Array(columns * rows);
    heat = new Float32Array(columns * rows);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        baseAlphas[row * columns + col] = isLogoCell(col, row) ? 0.1 : 0;
      }
    }

    pointer.cellIndex = getPixelCellIndex(pointer.x, pointer.y);
    if (pointer.active && pointer.cellIndex >= 0) heat[pointer.cellIndex] = 1;
    previousPixelsTime = 0;
    drawPixelGrid(pointer.active);
  };

  if (pointerFine && !prefersReducedMotion) {
    const updatePixelsPointer = (event) => {
      const nextX = event.offsetX;
      const nextY = event.offsetY;
      if (pointer.hasPosition) {
        heatPixelPath(pointer.x, pointer.y, nextX, nextY);
      }
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.cellIndex = getPixelCellIndex(nextX, nextY);
      if (pointer.cellIndex >= 0) heat[pointer.cellIndex] = 1;
      pointer.hasPosition = true;
    };

    pixelsCanvas.addEventListener('pointerenter', (event) => {
      pointer.active = true;
      pointer.hasPosition = false;
      updatePixelsPointer(event);
      startPixelsHeat();
    }, { passive: true });

    pixelsCanvas.addEventListener('pointermove', updatePixelsPointer, { passive: true });

    pixelsCanvas.addEventListener('pointerleave', () => {
      pointer.active = false;
      pointer.hasPosition = false;
      pointer.cellIndex = -1;
      startPixelsHeat();
    }, { passive: true });
  }

  const pixelsResizeObserver = new ResizeObserver(resizePixels);
  pixelsResizeObserver.observe(pixelsSection);
  resizePixels();
}

// ---------------------------------------------------------------------------
// Scroll source: Lenis at 30% of the previous wheel speed on desktop.
// Mobile stays native.
// ---------------------------------------------------------------------------
let lenis = null;

const setScrollMode = () => {
  const useLenis = !mqMobile.matches && !prefersReducedMotion;

  if (useLenis && !lenis) {
    lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 0.3,
      syncTouch: false,
      autoResize: false,
    });
  } else if (!useLenis) {
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
  }
};

const anchorHeader = document.querySelector('.site-header');

document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const hash = link.getAttribute('href');
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (!target) return;

    event.preventDefault();
    const isPageTop = target.id === 'top';
    const headerOffset = isPageTop
      ? 0
      : -((anchorHeader?.getBoundingClientRect().height || 0) + 15);

    if (lenis) {
      lenis.scrollTo(target, {
        offset: headerOffset,
        duration: 1.2,
      });
    } else {
      const targetTop = isPageTop
        ? 0
        : window.scrollY + target.getBoundingClientRect().top + headerOffset;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }

    if (window.location.hash !== hash) history.pushState(null, '', hash);
  });
});

const masterRaf = (time) => {
  lenis?.raf(time);
  requestAnimationFrame(masterRaf);
};
requestAnimationFrame(masterRaf);

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
  setScrollMode();
  measureWorks();
  lenis?.resize();
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
setScrollMode();
measureWorks();
(document.fonts?.ready || Promise.resolve()).then(() => {
  measureWorks();
  lenis?.resize();
});
