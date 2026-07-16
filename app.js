import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import Lenis from 'https://unpkg.com/lenis@1.3.4/dist/lenis.mjs';

const container = document.querySelector('.hero');
const cursorDot = document.querySelector('.cursor-dot');
const cursorEllipse = document.querySelector('.cursor-ellipse');
const cursorLabel = document.querySelector('.cursor-label');
const cursorTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const cursorCurrent = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const ellipseTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const ellipseCurrent = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

const onPointerMove = (event) => {
  cursorTarget.x = event.clientX;
  cursorTarget.y = event.clientY;
  ellipseTarget.x = event.clientX;
  ellipseTarget.y = event.clientY;
};

document.querySelectorAll('a, button').forEach((el) => {
  el.addEventListener('mouseenter', () => document.body.classList.add('is-interactive'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('is-interactive'));
});

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerdown', () => {
  cursorDot.style.transform = 'translate(-50%, -50%) scale(0.9)';
  cursorEllipse.style.transform = 'translate(-50%, -50%) scale(0.95)';
});
window.addEventListener('pointerup', () => {
  cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
  cursorEllipse.style.transform = 'translate(-50%, -50%) scale(1)';
});

const spBox = document.querySelector('.sp-box');
const projectBtn = spBox?.querySelector('.btn');

if (spBox && projectBtn) {
  const dvdMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DVD_SPEED = 1.75 / 3;
  const FOLLOW_LERP = 0.15;
  const position = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const velocity = { x: DVD_SPEED, y: DVD_SPEED };
  const bounds = {
    maxX: 0,
    maxY: 0,
    buttonWidth: 0,
    buttonHeight: 0,
    borderLeft: 0,
    borderTop: 0,
  };
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
    const boxStyle = getComputedStyle(spBox);
    const borderRight = parseFloat(boxStyle.borderRightWidth) || 0;
    const borderBottom = parseFloat(boxStyle.borderBottomWidth) || 0;

    bounds.borderLeft = parseFloat(boxStyle.borderLeftWidth) || 0;
    bounds.borderTop = parseFloat(boxStyle.borderTopWidth) || 0;
    bounds.buttonWidth = buttonRect.width;
    bounds.buttonHeight = buttonRect.height;
    bounds.maxX = Math.max(0, boxRect.width - bounds.borderLeft - borderRight - buttonRect.width);
    bounds.maxY = Math.max(0, boxRect.height - bounds.borderTop - borderBottom - buttonRect.height);

    if (!isMeasured || dvdMotionQuery.matches) {
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
    target.x = clamp(
      event.clientX - boxRect.left - bounds.borderLeft - bounds.buttonWidth / 2,
      0,
      bounds.maxX,
    );
    target.y = clamp(
      event.clientY - boxRect.top - bounds.borderTop - bounds.buttonHeight / 2,
      0,
      bounds.maxY,
    );
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
    if (dvdMotionQuery.matches || dvdFrameId) return;
    dvdFrameId = requestAnimationFrame(dvdTick);
  };

  const stopDvdAnimation = () => {
    cancelAnimationFrame(dvdFrameId);
    dvdFrameId = 0;
  };

  spBox.addEventListener('pointerenter', (event) => {
    document.body.classList.add('cursor-hide');
    if (dvdMotionQuery.matches) return;
    isFollowing = true;
    updateFollowTarget(event);
  });

  spBox.addEventListener('pointermove', (event) => {
    if (!isFollowing || dvdMotionQuery.matches) return;
    updateFollowTarget(event);
  });

  spBox.addEventListener('pointerleave', () => {
    document.body.classList.remove('cursor-hide');
    isFollowing = false;
    if (Math.hypot(velocity.x, velocity.y) < 0.1) {
      seedDvdVelocity();
    }
  });

  dvdMotionQuery.addEventListener('change', (event) => {
    isFollowing = false;
    measureDvdBounds();
    if (event.matches) {
      stopDvdAnimation();
    } else {
      if (Math.hypot(velocity.x, velocity.y) < 0.1) seedDvdVelocity();
      startDvdAnimation();
    }
  });

  window.addEventListener('resize', measureDvdBounds);
  new ResizeObserver(measureDvdBounds).observe(spBox);
  (document.fonts?.ready || Promise.resolve()).then(measureDvdBounds);

  measureDvdBounds();
  if (!dvdMotionQuery.matches) {
    seedDvdVelocity();
    startDvdAnimation();
  }
}

const animateCursor = () => {
  cursorCurrent.x = cursorTarget.x;
  cursorCurrent.y = cursorTarget.y;
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

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const heroSection = document.querySelector('.hero');
// Set once services are measured: how far above the viewport the sticky stage pins
let servicesPinShift = 0;

const updateHeroParallax = () => {
  const vh = window.innerHeight;
  const y = window.scrollY;
  const progress = Math.min(y / vh, 1);
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    // Background image keeps its slower parallax pace…
    canvas.style.transform = `translateY(${(-progress * vh * 0.3).toFixed(1)}px)`;
    // …but fully fades out by the moment the accordion pins
    const about = document.querySelector('.about');
    const fadeEnd = Math.max(1, (about ? about.offsetTop : vh) + servicesPinShift);
    canvas.style.opacity = Math.max(0, 1 - y / fadeEnd).toFixed(3);
  }
  const overlay = heroSection.querySelector('.overlay');
  if (overlay) {
    // Hero content scrolls at normal page speed, same as the second block
    overlay.style.transform = `translateY(${(-Math.min(y, vh * 1.5)).toFixed(1)}px)`;
  }
  heroSection.style.setProperty('--hero-shade', (progress * 0.55).toFixed(3));
};

if (!prefersReducedMotion) {
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  const lenisRaf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
  };
  requestAnimationFrame(lenisRaf);

  window.addEventListener('scroll', updateHeroParallax, { passive: true });
  window.addEventListener('resize', updateHeroParallax);
  updateHeroParallax();
}

const stairReveal = document.querySelector('.stair-reveal');
const stairRevealDone = new Promise((resolve) => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!stairReveal || reduced) {
    stairReveal?.remove();
    resolve();
    return;
  }

  (document.fonts?.ready || Promise.resolve()).then(() => {
    setTimeout(() => {
      stairReveal.classList.add('is-open');
      // Content starts animating while the back layer is still clearing
      setTimeout(resolve, 700);
      // Last back step: 0.16s layer delay + 7 * 0.055s stagger + 0.75s duration
      setTimeout(() => stairReveal.remove(), 1500);
    }, 250);
  });
});

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

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = Array.from(document.querySelectorAll('[data-fade]'));
  elements.forEach((el, index) => {
    el.style.transitionDelay = `${index * 0.06}s`;
    if (reduced) {
      el.classList.add('is-in');
    }
  });

  if (reduced) return;

  stairRevealDone.then(() => {
    requestAnimationFrame(() => {
      elements.forEach((el) => el.classList.add('is-in'));
    });
  });
}

document.querySelectorAll('[data-reveal]').forEach(setupReveal);

const heroRevealTitle = document.querySelector('.hero h1[data-reveal]');
const scrambleMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (heroRevealTitle) {
  const scrambleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$@/\\<>*';
  const scrambleDuration = 600;
  const scrambleInterval = 45;
  const activeScrambles = new Map();

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

setupFadeIn();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x0e0e10, 1);
container.prepend(renderer.domElement);
renderer.domElement.id = 'hero-canvas';

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
camera.position.z = 1;

const scene = new THREE.Scene();
const geometry = new THREE.PlaneGeometry(2.08, 2.08);
const uniforms = {
  uTexture: { value: null },
  uDisplacement: { value: null },
  uFlowMap: { value: null },
  uMouse: { value: new THREE.Vector2(0.5, 0.5) },
  uParallax: { value: new THREE.Vector2(0, 0) },
  uMouseInfluence: { value: 0.0 },
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
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
    uniform vec2 uParallax;
    uniform float uMouseInfluence;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      vec2 parallax = uParallax / uResolution;
      uv += parallax;

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

      gl_FragColor = texture2D(uTexture, uv);
    }
  `,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const textureLoader = new THREE.TextureLoader();
const texturePaths = [
  'assets/header-1.png',
  'assets/heightMap.png',
  'assets/map-9.jpg',
];

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

const pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
let targetMouse = { x: 0.5, y: 0.5 };
let smoothedMouse = { x: 0.5, y: 0.5 };
let influence = 0.0;
let activePointer = false;

const updateMouse = (x, y) => {
  targetMouse.x = x;
  targetMouse.y = y;
  activePointer = true;
  influence = 1.0;
};

if (pointerFine) {
  window.addEventListener('pointermove', (event) => {
    const x = event.clientX / window.innerWidth;
    const y = 1 - event.clientY / window.innerHeight;
    updateMouse(x, y);
  });

  window.addEventListener('pointerleave', () => {
    activePointer = false;
  });
}

let ready = false;
Promise.all(texturePaths.map(loadTexture)).then(([texture, displacement, flowMap]) => {
  uniforms.uTexture.value = texture;
  uniforms.uDisplacement.value = displacement;
  uniforms.uFlowMap.value = flowMap;
  ready = true;
  animate();
});

const animate = () => {
  if (!ready) {
    return;
  }

  smoothedMouse.x += (targetMouse.x - smoothedMouse.x) * 0.06;
  smoothedMouse.y += (targetMouse.y - smoothedMouse.y) * 0.06;

  if (activePointer) {
    influence += (1 - influence) * 0.16;
  } else {
    influence *= 0.94;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  uniforms.uMouse.value.set(smoothedMouse.x, smoothedMouse.y);
  uniforms.uParallax.value.set((0.5 - smoothedMouse.x) * 30, (0.5 - smoothedMouse.y) * 30);
  uniforms.uMouseInfluence.value = influence;
  uniforms.uTime.value += 0.016;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  uniforms.uResolution.value.set(width, height);
});

const aboutSection = document.querySelector('.about');
const serviceEls = Array.from(document.querySelectorAll('.service'));
if (aboutSection && serviceEls.length) {
  const bodyWraps = serviceEls.map((el) => el.querySelector('.service-body-wrap'));
  let bodyHeights = bodyWraps.map(() => 0);

  const updateServicesCollapse = () => {
    const vh = window.innerHeight;
    const pinStart = aboutSection.offsetTop + servicesPinShift;
    const pinDistance = aboutSection.offsetHeight - vh - servicesPinShift;
    if (pinDistance <= 0) return;
    const progress = Math.min(1, Math.max(0, (window.scrollY - pinStart) / pinDistance));
    serviceEls.forEach((el, i) => {
      const local = Math.min(1, Math.max(0, progress * serviceEls.length - i));
      bodyWraps[i].style.height = `${Math.round(bodyHeights[i] * (1 - local))}px`;
      bodyWraps[i].style.opacity = `${1 - local}`;
      el.classList.toggle('is-collapsed', local >= 1);
    });
  };

  const measureServices = () => {
    bodyWraps.forEach((wrap, i) => {
      wrap.style.height = 'auto';
      bodyHeights[i] = wrap.scrollHeight;
    });
    // Pin the stage higher than the viewport top so the first service
    // stops 30px below the fixed header before the accordion starts
    const sticky = document.querySelector('.about-sticky');
    const header = document.querySelector('.site-header');
    if (sticky && header && serviceEls[0]) {
      const headerBottom = header.getBoundingClientRect().bottom;
      const firstServiceTop = serviceEls[0].getBoundingClientRect().top - sticky.getBoundingClientRect().top;
      servicesPinShift = Math.max(0, Math.round(firstServiceTop - headerBottom - 30));
      sticky.style.top = `${-servicesPinShift}px`;
    }
    updateServicesCollapse();
  };

  window.addEventListener('scroll', updateServicesCollapse, { passive: true });
  window.addEventListener('resize', measureServices);
  (document.fonts?.ready || Promise.resolve()).then(measureServices);

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

  serviceEls.forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-more'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-more'));
  });
}
