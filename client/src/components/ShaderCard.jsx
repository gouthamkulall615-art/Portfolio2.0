import { useEffect, useRef } from 'react';
import '../css/ShaderCard.css';

const VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_color;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;          // 0..1, y up
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.0;
  float t = u_time * 0.35;

  // domain-warped noise scrolling downward = flame rising
  vec2 q = p - vec2(0.0, t);
  float w = fbm(q + fbm(q * 1.5 + t * 0.4));

  // strong at the bottom, fading toward the top
  float I = (1.0 - uv.y) * 1.35 - 0.2 + (w - 0.5) * 1.15;
  I = clamp(I, 0.0, 1.0);

  vec3 base = vec3(0.063);
  vec3 deep = u_color * 0.75;
  vec3 hot  = mix(u_color, vec3(0.93, 0.85, 1.0), 0.65);

  vec3 col = mix(base, deep, smoothstep(0.05, 0.55, I));
  col = mix(col, hot, smoothstep(0.5, 1.0, I));
  gl_FragColor = vec4(col, 1.0);
}`;

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export default function ShaderCard({
  children,
  color = '#8b5cf6',
  speed = 1,
  tilt = true,
  className = '',
}) {
  const cardRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      canvas.style.display = 'none';
      return;
    } // CSS gradient fallback shows

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_color'), hexToRgb(color));

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const start = performance.now();
    let raf = 0;

    const draw = (time) => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now) => {
      draw(((now - start) / 1000) * speed);
      raf = requestAnimationFrame(loop);
    };

    const play = () => {
      if (!raf && !reduce) raf = requestAnimationFrame(loop);
    };

    const pause = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (!raf) draw(3); // keep a still frame when paused / reduced motion
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Only animate while the card is in viewport
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()));
    io.observe(canvas);
    resize();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [color, speed]);

  const onMove = (e) => {
    if (!tilt) return;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
  };

  const onLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
  };

  return (
    <div
      ref={cardRef}
      className={`shader-card ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <canvas ref={canvasRef} className="shader-card__canvas" aria-hidden="true" />
      <div className="shader-card__content">{children}</div>
    </div>
  );
}
