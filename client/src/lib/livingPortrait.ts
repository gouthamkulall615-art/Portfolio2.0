// @ts-nocheck

export function initLivingPortrait(root: HTMLElement): () => void {
  if (!root) return () => {};

  const canvas = root.querySelector('#faceGl');
  const fallback = root.querySelector('#faceFallback');
  const inner = root.querySelector('#magnetInner');

  if (!canvas || !inner) return () => {};

  let gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  } catch (err) {
    gl = null;
  }

  if (!gl) {
    if (fallback) fallback.style.opacity = '1';
    return () => {};
  }

  let isDisposed = false;

  const SIDE = 'w'; // 'w' = his eyes look to viewer's LEFT in side.webp, 'e' = RIGHT.
  const url = id => (import.meta.env.BASE_URL || '/') + 'face/' + id + '.webp';
  const IDS = { rest: 'rest', closed: 'closed', side: 'side', tensed: 'tensed', yawn: 'yawn' };
  const EYE_V = 0.38;

  const RING = ['e', 'ene', 'ne', 'nne', 'n', 'nnw', 'nw', 'wnw', 'w', 'wsw', 'sw', 'ssw', 's', 'sse', 'se', 'ese'];
  const NEAR = ({ w: ['w', 'wnw', 'wsw', 'nw', 'sw'], e: ['e', 'ene', 'ese', 'ne', 'se'] })[SIDE];
  const EYEFILE = { closed: 'closed', half: 'closed' };
  RING.forEach(c => {
    EYEFILE[c] = NEAR.includes(c) ? 'side' : 'rest';
  });

  const ALIAS = {
    angry: 'tensed',
    ouch: 'tensed',
    scared: 'tensed',
    scrunch: 'tensed',
    shock: 'tensed',
    dizzy: 'tensed',
    cry: 'tensed',
    sick: 'tensed',
    deadpan: 'rest'
  };

  const ZONES = {
    hover: {},
    tap: {
      brow: 'tensed',
      eyeL: 'tensed',
      eyeR: 'tensed',
      nose: 'tensed',
      cheek: 'tensed',
      mouth: 'yawn',
      chin: 'yawn'
    }
  };

  const zoneAt = (u, v) => {
    const a = (u - 0.5) / 0.2;
    const b = (v - 0.4) / 0.27;
    if (a * a + b * b > 1 || v < 0.215) return 'hair';
    if (v < 0.32) return 'brow';
    if (Math.abs(v - EYE_V) < 0.035 && u > 0.36 && u < 0.46) return 'eyeL';
    if (Math.abs(v - EYE_V) < 0.035 && u > 0.54 && u < 0.64) return 'eyeR';
    if (Math.abs(u - 0.5) < 0.04 && v < 0.52) return 'nose';
    if (v > 0.52 && v < 0.6 && Math.abs(u - 0.5) < 0.08) return 'mouth';
    return v > 0.6 ? 'chin' : 'cheek';
  };

  const ACTS = {
    yawn: [
      ['closed', 120, 200],
      ['yawn', 170, 1500],
      ['closed', 140, 220],
      ['eye:rest', 100, 100]
    ],
    shifty: [
      ['eye:' + SIDE, 60, 560],
      ['eye:rest', 60, 380],
      ['eye:' + SIDE, 60, 460],
      ['eye:rest', 60, 260]
    ],
    doze: [
      ['closed', 450, 700, { lean: [0.006, 0.006] }],
      ['closed', 320, 1500, { lean: [0.02, 0.02] }],
      ['tensed', 50, 650, { jolt: [0.5, 0.4, 0, -0.9, 0.3] }]
    ],
    fly: 'fly',
    tug: 'tug',
    hair: 'hair'
  };

  const ROTATION = ['yawn', 'shifty', 'doze'];

  // --- Shaders ---
  const vsSource = `
    attribute vec2 a_base;
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_base;
      gl_Position = vec4(a_pos * 2.0 - 1.0, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_texA;
    uniform sampler2D u_texB;
    uniform float u_mix;
    void main() {
      vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
      vec4 colA = texture2D(u_texA, uv);
      vec4 colB = texture2D(u_texB, uv);
      gl_FragColor = mix(colA, colB, u_mix);
    }
  `;

  function createShader(glCtx, type, source) {
    const s = glCtx.createShader(type);
    if (!s) return null;
    glCtx.shaderSource(s, source);
    glCtx.compileShader(s);
    return s;
  }

  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return () => {};

  const prog = gl.createProgram();
  if (!prog) return () => {};
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const aBaseLoc = gl.getAttribLocation(prog, 'a_base');
  const aPosLoc = gl.getAttribLocation(prog, 'a_pos');
  const uTexALoc = gl.getUniformLocation(prog, 'u_texA');
  const uTexBLoc = gl.getUniformLocation(prog, 'u_texB');
  const uMixLoc = gl.getUniformLocation(prog, 'u_mix');

  // --- 16x16 Mesh Grid ---
  const GRID_SIZE = 16;
  const NUM_VERTICES = (GRID_SIZE + 1) * (GRID_SIZE + 1);
  const baseCoords = new Float32Array(NUM_VERTICES * 2);
  const currentPos = new Float32Array(NUM_VERTICES * 2);
  const velocity = new Float32Array(NUM_VERTICES * 2);

  for (let j = 0; j <= GRID_SIZE; j++) {
    for (let i = 0; i <= GRID_SIZE; i++) {
      const idx = (j * (GRID_SIZE + 1) + i) * 2;
      const u = i / GRID_SIZE;
      const v = j / GRID_SIZE;
      baseCoords[idx] = u;
      baseCoords[idx + 1] = v;
      currentPos[idx] = u;
      currentPos[idx + 1] = v;
      velocity[idx] = 0;
      velocity[idx + 1] = 0;
    }
  }

  const indices = new Uint16Array(GRID_SIZE * GRID_SIZE * 6);
  let idxOffset = 0;
  for (let j = 0; j < GRID_SIZE; j++) {
    for (let i = 0; i < GRID_SIZE; i++) {
      const row1 = j * (GRID_SIZE + 1) + i;
      const row2 = (j + 1) * (GRID_SIZE + 1) + i;
      indices[idxOffset++] = row1;
      indices[idxOffset++] = row2;
      indices[idxOffset++] = row1 + 1;
      indices[idxOffset++] = row1 + 1;
      indices[idxOffset++] = row2;
      indices[idxOffset++] = row2 + 1;
    }
  }

  const baseBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, baseBuf);
  gl.bufferData(gl.ARRAY_BUFFER, baseCoords, gl.STATIC_DRAW);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, currentPos, gl.DYNAMIC_DRAW);

  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  // --- Textures ---
  const tex = {};
  function createSolidTexture(r, g, b, a) {
    if (!gl) return null;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    const pixel = new Uint8Array([r, g, b, a]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return t;
  }

  const dummyTex = createSolidTexture(12, 12, 12, 255);

  Object.keys(IDS).forEach(k => {
    tex[k] = dummyTex;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const srcUrl = url(k);
    img.src = srcUrl;
    img.onload = () => {
      if (isDisposed || !gl) return;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      tex[k] = t;
      if (k === 'rest' && fallback) {
        fallback.style.opacity = '0';
      }
    };
    img.onerror = () => {
      if (k === 'rest') {
        console.error('[portrait] failed to load', srcUrl);
        if (fallback) fallback.style.opacity = '1';
      }
    };
  });

  // --- Crossfade & State Machine ---
  let faceA = 'closed';
  let faceB = 'closed';
  let mixVal = 1.0;
  let fadeStartTime = performance.now();
  let fadeDuration = 70; // capped at 70ms

  function show(n, ms = 70, now = performance.now()) {
    n = ALIAS[n] || n;
    if (!tex[n] || n === faceB) return;
    faceA = faceB;
    faceB = n;
    mixVal = 0.0;
    fadeStartTime = now;
    fadeDuration = Math.min(ms > 0 ? ms : 70, 70);
  }

  // Wake on first move
  let hasWokenUp = false;
  let lastInteractionTime = performance.now();
  let isActing = false;
  let actTimeout = null;

  function resetIdleTimer() {
    lastInteractionTime = performance.now();
    if (isActing) {
      isActing = false;
      if (actTimeout) clearTimeout(actTimeout);
      show('rest', 60);
    }
  }

  let isDragging = false;
  let dragStartU = 0.5;
  let dragStartV = 0.5;
  let dragCurU = 0.5;
  let dragCurV = 0.5;
  let pointerU = 0.5;
  let pointerV = 0.5;

  let leanX = 0;
  let leanY = 0;

  const ripples = [];
  let nextBlinkTime = performance.now() + 2500;
  let isBlinking = false;

  const getCoords = e => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const onPointerMove = e => {
    const coords = getCoords(e);
    const rect = canvas.getBoundingClientRect();
    const u = (coords.clientX - rect.left) / rect.width;
    const v = (coords.clientY - rect.top) / rect.height;
    pointerU = Math.max(0, Math.min(1, u));
    pointerV = Math.max(0, Math.min(1, v));

    if (!hasWokenUp) {
      hasWokenUp = true;
      show('rest', 70);
    }

    resetIdleTimer();

    if (isDragging) {
      dragCurU = pointerU;
      dragCurV = pointerV;
    } else if (!isActing && !isBlinking) {
      const dx = pointerU - 0.5;
      const dy = pointerV - EYE_V;
      const dist = Math.hypot(dx, dy);

      leanX = dx * 0.06;
      leanY = dy * 0.06;

      if (dist > 0.08) {
        const angle = Math.atan2(dy, dx);
        let normAngle = (angle >= 0 ? angle : angle + Math.PI * 2);
        const sectorIdx = Math.round((normAngle / (Math.PI * 2)) * 16) % 16;
        const dir = RING[sectorIdx];
        const targetKey = EYEFILE[dir] || 'rest';
        show(targetKey, 70);
      } else {
        show('rest', 70);
      }
    }
  };

  const onPointerDown = e => {
    resetIdleTimer();
    const coords = getCoords(e);
    const rect = canvas.getBoundingClientRect();
    const u = (coords.clientX - rect.left) / rect.width;
    const v = (coords.clientY - rect.top) / rect.height;

    isDragging = true;
    dragStartU = u;
    dragStartV = v;
    dragCurU = u;
    dragCurV = v;

    const zone = zoneAt(u, v);
    if (zone in ZONES.tap) {
      const act = ZONES.tap[zone];
      show(act, 60);
    }
  };

  const onPointerUp = () => {
    if (isDragging) {
      isDragging = false;
      ripples.push({ u: dragCurU, v: dragCurV, time: performance.now(), amp: 0.035 });
      show('tensed', 60);
      setTimeout(() => {
        if (!isDragging && !isActing) show('rest', 70);
      }, 320);
    }
    resetIdleTimer();
  };

  const onTouchStart = e => {
    if (e.cancelable) e.preventDefault();
    onPointerDown(e);
  };

  const onTouchMove = e => {
    if (isDragging) {
      if (e.cancelable) e.preventDefault();
      onPointerMove(e);
    }
  };

  const onTouchEnd = () => {
    onPointerUp();
  };

  const onScroll = () => {
    resetIdleTimer();
    if (!isActing && hasWokenUp) {
      show('rest', 70);
      leanY = 0.04;
    }
  };

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('scroll', onScroll, { passive: true });

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: false });
  window.addEventListener('touchcancel', onTouchEnd, { passive: false });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Physics loop (1/240s) ---
  const DT = 1 / 240;
  let lastSimTime = performance.now();
  let simAccumulator = 0;

  function physicsStep() {
    const k = 140.0;
    const damping = 8.5;
    const pullActive = isDragging;
    const pullOriginU = dragStartU;
    const pullOriginV = dragStartV;
    const pullDeltaU = (dragCurU - dragStartU) * 0.45;
    const pullDeltaV = (dragCurV - dragStartV) * 0.45;

    const now = performance.now();

    for (let i = 0; i < NUM_VERTICES; i++) {
      const idx = i * 2;
      const bu = baseCoords[idx];
      const bv = baseCoords[idx + 1];
      let cu = currentPos[idx];
      let cv = currentPos[idx + 1];
      let vu = velocity[idx];
      let vv = velocity[idx + 1];

      let fu = -k * (cu - bu) - damping * vu;
      let fv = -k * (cv - bv) - damping * vv;

      if (pullActive) {
        const d = Math.hypot(bu - pullOriginU, bv - pullOriginV);
        const influence = Math.exp(-d * 6.5);
        fu += pullDeltaU * influence * 220;
        fv += pullDeltaV * influence * 220;
      }

      for (let r = 0; r < ripples.length; r++) {
        const rip = ripples[r];
        const age = (now - rip.time) / 1000;
        const waveDist = age * 0.9;
        const d = Math.hypot(bu - rip.u, bv - rip.v);
        const wave = Math.sin((d - waveDist) * 35.0) * Math.exp(-age * 4.0 - d * 3.0);
        fu += wave * rip.amp * 150;
        fv += wave * rip.amp * 150;
      }

      vu += fu * DT;
      vv += fv * DT;
      cu += vu * DT;
      cv += vv * DT;

      velocity[idx] = vu;
      velocity[idx + 1] = vv;
      currentPos[idx] = cu;
      currentPos[idx + 1] = cv;
    }

    // Untangle Step
    for (let j = 0; j <= GRID_SIZE; j++) {
      for (let i = 0; i <= GRID_SIZE; i++) {
        const idx = (j * (GRID_SIZE + 1) + i) * 2;
        if (i < GRID_SIZE) {
          const rightIdx = (j * (GRID_SIZE + 1) + i + 1) * 2;
          const minDist = 0.02 / GRID_SIZE;
          if (currentPos[rightIdx] - currentPos[idx] < minDist) {
            const mid = (currentPos[rightIdx] + currentPos[idx]) / 2;
            currentPos[idx] = mid - minDist / 2;
            currentPos[rightIdx] = mid + minDist / 2;
          }
        }
        if (j < GRID_SIZE) {
          const bottomIdx = ((j + 1) * (GRID_SIZE + 1) + i) * 2;
          const minDist = 0.02 / GRID_SIZE;
          if (currentPos[bottomIdx + 1] - currentPos[idx + 1] < minDist) {
            const mid = (currentPos[bottomIdx + 1] + currentPos[idx + 1]) / 2;
            currentPos[idx + 1] = mid - minDist / 2;
            currentPos[bottomIdx + 1] = mid + minDist / 2;
          }
        }
      }
    }

    for (let r = ripples.length - 1; r >= 0; r--) {
      if ((now - ripples[r].time) > 1200) ripples.splice(r, 1);
    }
  }

  let animFrameId = null;

  const render = () => {
    if (isDisposed || !gl) return;
    const now = performance.now();

    const frameDelta = Math.min((now - lastSimTime) / 1000, 0.1);
    lastSimTime = now;
    simAccumulator += frameDelta;
    while (simAccumulator >= DT) {
      physicsStep();
      simAccumulator -= DT;
    }

    if (mixVal < 1.0) {
      const elapsed = now - fadeStartTime;
      mixVal = Math.min(1.0, elapsed / fadeDuration);
      if (mixVal >= 1.0) faceA = faceB;
    }

    if (hasWokenUp && !isActing && !isDragging && now >= nextBlinkTime) {
      isBlinking = true;
      show('closed', 50);
      setTimeout(() => {
        if (!isActing && !isDragging) show('rest', 60);
        isBlinking = false;
      }, 130);
      nextBlinkTime = now + 2200 + Math.random() * 3400;
    }

    const idleElapsed = (now - lastInteractionTime) / 1000;
    if (!prefersReducedMotion && !isActing && !isDragging && idleElapsed > 35) {
      isActing = true;
      const actName = ROTATION[Math.floor(Math.random() * ROTATION.length)];
      const steps = ACTS[actName];
      if (Array.isArray(steps)) {
        let stepDelay = 0;
        steps.forEach(([pic, duration, hold]) => {
          actTimeout = setTimeout(() => {
            if (isActing) {
              const target = pic.startsWith('eye:') ? pic.replace('eye:', '') : pic;
              show(target, duration);
            }
          }, stepDelay);
          stepDelay += duration + hold;
        });
        actTimeout = setTimeout(() => {
          isActing = false;
          resetIdleTimer();
          show('rest', 70);
        }, stepDelay);
      }
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = Math.round(canvas.clientWidth * dpr);
    const displayH = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
      gl.viewport(0, 0, displayW, displayH);
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, currentPos);

    gl.bindBuffer(gl.ARRAY_BUFFER, baseBuf);
    gl.enableVertexAttribArray(aBaseLoc);
    gl.vertexAttribPointer(aBaseLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    const textureA = tex[faceA] || dummyTex;
    const textureB = tex[faceB] || dummyTex;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureA);
    gl.uniform1i(uTexALoc, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureB);
    gl.uniform1i(uTexBLoc, 1);

    gl.uniform1f(uMixLoc, mixVal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    inner.style.transform = `perspective(1000px) rotateY(${leanX * 18}deg) rotateX(${-leanY * 18}deg)`;

    animFrameId = requestAnimationFrame(render);
  };

  animFrameId = requestAnimationFrame(render);

  return () => {
    isDisposed = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    window.removeEventListener('mousemove', onPointerMove);
    canvas.removeEventListener('mousedown', onPointerDown);
    window.removeEventListener('mouseup', onPointerUp);
    window.removeEventListener('scroll', onScroll);
    canvas.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
    if (actTimeout) clearTimeout(actTimeout);
  };
}

