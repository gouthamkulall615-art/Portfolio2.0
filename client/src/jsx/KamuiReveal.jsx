import React, { useEffect, useRef } from 'react';
import './KamuiReveal.css';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uObito;
uniform sampler2D uFace;
uniform float uP;
uniform float uAspect;
uniform vec2  uEye;
uniform vec2  uFaceC;
uniform vec2  uFaceR;
uniform float uTurns, uR0, uRmax, uSkewY;
const float TAU = 6.2831853;

void main() {
  // 2. spiral space
  vec2 d = (vUv - uEye) * vec2(1.0, 1.0 / uAspect);
  d.y /= uSkewY;
  float r = length(d);
  float a = mod(atan(d.y, d.x) + 1.5707963, TAU);

  // 3-4. archimedean arrival time
  float k = (uRmax - uR0) / (uTurns * TAU);
  float thR = max(r - uR0, 0.0) / k;
  float m = max(ceil((thR - a) / TAU), 0.0);
  float thStar = a + TAU * m;
  float cur = uP * uTurns * TAU;
  float edge = cur - thStar;

  float reveal = smoothstep(0.0, 0.22, edge);
  reveal = max(reveal, smoothstep(0.96, 1.0, uP));

  // 6. masks
  float e = length((vUv - uFaceC) / uFaceR);
  float faceMask = 1.0 - smoothstep(0.90, 1.0, e);
  float wideMask = 1.0 - smoothstep(1.0, 1.25, e);

  // 7. suction twist
  float pull = exp(-pow((edge + 0.4) / 0.9, 2.0)) * wideMask;
  pull *= smoothstep(0.0, 0.05, uP) * (1.0 - smoothstep(0.93, 1.0, uP));
  vec2 q = vUv - uEye;
  q.x *= uAspect;
  float ang = 0.55 * pull;
  q = vec2(cos(ang) * q.x - sin(ang) * q.y, sin(ang) * q.x + cos(ang) * q.y);
  q.x /= uAspect;
  vec2 uvO = uEye + q * (1.0 - 0.10 * pull);

  vec4 o = texture2D(uObito, clamp(uvO, 0.0, 1.0));
  vec4 f = texture2D(uFace, vUv);

  // 9. grade the photo to sit in the artwork
  float lum = dot(f.rgb, vec3(0.299, 0.587, 0.114));
  f.rgb = mix(f.rgb, vec3(lum), 0.10) * vec3(1.04, 1.0, 0.93);
  f.rgb *= 1.0 - 0.38 * smoothstep(0.45, 1.0, e);

  vec4 c = mix(o, f, reveal * faceMask);

  // 9. orange rim light
  float rim = smoothstep(0.80, 0.97, e) * (1.0 - smoothstep(0.97, 1.03, e)) * reveal;
  c.rgb += vec3(1.0, 0.42, 0.08) * rim * 0.22 * c.a;

  // 8. fiery wavefront
  float fade = smoothstep(0.0, 0.04, uP) * (1.0 - smoothstep(0.94, 1.0, uP));
  float band = exp(-pow((edge - 0.05) / 0.28, 2.0));
  float core = exp(-pow((edge - 0.02) / 0.08, 2.0));
  float glow = band * wideMask * fade;
  vec3 fire = mix(vec3(1.0, 0.30, 0.02), vec3(1.0, 0.88, 0.45), core);
  c.rgb += fire * glow * 1.2 * max(c.a, 0.25);
  c.a = max(c.a, glow * 0.6);

  gl_FragColor = c;
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function KamuiReveal({
  obitoSrc,
  faceSrc,
  eye = [0.4675, 0.405],
  faceCenter = [0.496, 0.424],
  faceRadius = [0.127, 0.29],
  turns = 3.6,
  r0 = 0.012,
  rMax = 0.205,
  skewY = 1.28,
  forwardSeconds = 2.8,
  reverseSeconds = 0.35,
  leaveScale = 1.03,
  autoReverseMs = 2800,
  labelClosed = 'Unmask',
  labelOpen = "Hi, I'm Goutham",
  debug = false,
  className = 'hero-portrait-img hero-portrait-composite',
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const pillRef = useRef(null);
  const labelRef = useRef(null);
  const paramsRef = useRef({});
  paramsRef.current = {
    eye, faceCenter, faceRadius, turns, r0, rMax, skewY,
    forwardSeconds, reverseSeconds, leaveScale, autoReverseMs, labelClosed, labelOpen,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const pill = pillRef.current;
    const label = labelRef.current;
    if (!canvas || !wrap || !pill || !label) return;

    let cancelled = false;
    let cleanup = () => {};

    if ('userAgentData' in navigator) pill.classList.add('kamui-pill--refract');

    (async () => {
      const [obito, face] = await Promise.all([loadImage(obitoSrc), loadImage(faceSrc)]);
      if (cancelled) return;

      canvas.width = obito.naturalWidth;
      canvas.height = obito.naturalHeight;
      const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
      if (!gl) return;

      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const makeTex = (img, unit) => {
        const tx = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return tx;
      };
      const texO = makeTex(obito, 0);
      const texF = makeTex(face, 1);
      gl.uniform1i(gl.getUniformLocation(prog, 'uObito'), 0);
      gl.uniform1i(gl.getUniformLocation(prog, 'uFace'), 1);
      const U = (n) => gl.getUniformLocation(prog, n);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const draw = (eased) => {
        const p = paramsRef.current;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U('uP'), eased);
        gl.uniform1f(U('uAspect'), canvas.width / canvas.height);
        gl.uniform2fv(U('uEye'), p.eye);
        gl.uniform2fv(U('uFaceC'), p.faceCenter);
        gl.uniform2fv(U('uFaceR'), p.faceRadius);
        gl.uniform1f(U('uTurns'), p.turns);
        gl.uniform1f(U('uR0'), p.r0);
        gl.uniform1f(U('uRmax'), p.rMax);
        gl.uniform1f(U('uSkewY'), p.skewY);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };

      // ---------- state ----------
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let t = 0, target = 0, last = 0, raf = 0, timer = 0;
      let hovering = false, lastX = -1, lastY = -1;
      let px = 0, py = 0, tx = 0, ty = 0, pv = 0, pillTarget = 0;
      let labelIsOpen = false;

      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const p = paramsRef.current;

        if (t !== target) {
          const dur = target > t ? p.forwardSeconds : p.reverseSeconds;
          const s = dt / dur;
          t = target > t ? Math.min(target, t + s) : Math.max(target, t - s);
          draw(easeInOut(t));
        }

        const k = 1 - Math.exp(-dt * 14);
        px += (tx - px) * k;
        py += (ty - py) * k;
        pv += (pillTarget - pv) * (1 - Math.exp(-dt * 12));
        pill.style.opacity = pv.toFixed(3);
        pill.style.transform =
          `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) translate(-50%,0) scale(${(0.7 + 0.3 * pv).toFixed(3)})`;

        const open = easeInOut(t) > 0.9;
        if (open !== labelIsOpen) {
          labelIsOpen = open;
          label.textContent = open ? p.labelOpen : p.labelClosed;
        }

        const busy =
          t !== target ||
          Math.abs(pillTarget - pv) > 0.002 ||
          Math.hypot(tx - px, ty - py) > 0.3;
        raf = busy ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => {
        if (!raf) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      };
      const go = (v) => {
        target = v;
        if (reduced) {
          t = v;
          draw(easeInOut(t));
        }
        kick();
      };

      draw(0);
      label.textContent = paramsRef.current.labelClosed;

      // ---------- hit-test: ellipse of the mask ----------
      const inside = (cx, cy) => {
        const r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        const p = paramsRef.current;
        const dx = ((cx - r.left) / r.width - p.faceCenter[0]) / p.faceRadius[0];
        const dy = ((cy - r.top) / r.height - p.faceCenter[1]) / p.faceRadius[1];
        return Math.hypot(dx, dy) <= (hovering ? p.leaveScale : 1.0);
      };
      const placePill = (cx, cy) => {
        const w = wrap.getBoundingClientRect();
        tx = clamp(cx - w.left, 70, w.width - 70);
        ty = cy - w.top + 26;
      };
      const setHover = (v) => {
        if (v === hovering) return;
        hovering = v;
        pillTarget = v ? 1 : 0;
        document.body.style.cursor = v ? 'pointer' : '';
        if (v && pv < 0.02) { px = tx; py = ty; }
        go(v ? 1 : 0);
      };

      const onMove = (e) => {
        if (e.pointerType === 'touch') return;
        lastX = e.clientX; lastY = e.clientY;
        const ins = inside(lastX, lastY);
        if (ins) placePill(lastX, lastY);
        setHover(ins);
        if (hovering) kick();
      };
      const onScroll = () => { if (lastX >= 0) setHover(inside(lastX, lastY)); };
      const onAway = () => setHover(false);
      const onDown = (e) => {
        if (e.pointerType !== 'touch') return;
        clearTimeout(timer);
        if (inside(e.clientX, e.clientY) && target < 0.5) {
          go(1);
          timer = setTimeout(() => go(0), paramsRef.current.autoReverseMs);
        } else {
          go(0);
        }
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('blur', onAway);
      document.documentElement.addEventListener('pointerleave', onAway);

      cleanup = () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
        document.body.style.cursor = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('blur', onAway);
        document.documentElement.removeEventListener('pointerleave', onAway);
        gl.deleteTexture(texO);
        gl.deleteTexture(texF);
        gl.deleteProgram(prog);
      };
    })().catch(console.error);

    return () => { cancelled = true; cleanup(); };
  }, [obitoSrc, faceSrc]);

  const onDebugClick = (e) => {
    if (!debug) return;
    const r = canvasRef.current.getBoundingClientRect();
    console.log(`normalized: [${((e.clientX - r.left) / r.width).toFixed(4)}, ${((e.clientY - r.top) / r.height).toFixed(4)}]`);
  };

  return (
    <div ref={wrapRef} className="kamui-wrap">
      <canvas
        ref={canvasRef}
        className={className}
        onClick={onDebugClick}
        aria-label="Interactive portrait: Obito Uchiha revealing Goutham M"
      />
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="kamui-liquid" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="4" result="n" />
          <feGaussianBlur in="n" stdDeviation="2" result="nb" />
          <feDisplacementMap in="SourceGraphic" in2="nb" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div ref={pillRef} className="kamui-pill" aria-hidden="true">
        <span className="kamui-pill__dot" />
        <span ref={labelRef} className="kamui-pill__label">{labelClosed}</span>
      </div>
    </div>
  );
}
