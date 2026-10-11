import { useEffect, useRef } from 'react';

const VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform float u_ignite;
uniform float u_light;      // 0 = dark theme, 1 = light theme
uniform float u_intensity;
uniform vec3  u_color;

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
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.0;
  float t = u_time * 0.35;

  vec2 q = p - vec2(0.0, t);
  float w = fbm(q + fbm(q * 1.5 + t * 0.4));

  float rise = mix(0.55, 1.0, u_ignite);
  float I = (1.0 - uv.y) * 1.35 * rise - 0.2 + (w - 0.5) * 1.15;
  I = clamp(I, 0.0, 1.0);

  vec3 deep     = u_color * 0.75;
  vec3 hotDark  = mix(u_color, vec3(0.93, 0.85, 1.0), 0.65);  // glowing on dark
  vec3 hotLight = mix(u_color, vec3(0.75, 0.55, 1.0), 0.35);  // stays saturated on white
  vec3 hot      = mix(hotDark, hotLight, u_light);
  vec3 col      = mix(deep, hot, smoothstep(0.5, 1.0, I));

  float a = smoothstep(0.04, 0.55, I) * u_ignite * u_intensity;
  gl_FragColor = vec4(col * a, a);   // premultiplied alpha
}`;

const hexToRgb = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const compile = (gl, type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[FlameShader] compile error:', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
};

export default function FlameShaderCanvas({
  color = '#8b5cf6',
  speed = 1,
  intensity = 1,
  active = true,
  isLight = false,
}) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  const lightRef = useRef(isLight);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { lightRef.current = isLight; }, [isLight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) { console.warn('[FlameShader] WebGL unavailable'); return; }

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
    const uIgnite = gl.getUniformLocation(prog, 'u_ignite');
    const uLight = gl.getUniformLocation(prog, 'u_light');
    gl.uniform1f(gl.getUniformLocation(prog, 'u_intensity'), intensity);
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_color'), hexToRgb(color));
    gl.clearColor(0, 0, 0, 0);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spd = reduce ? 0 : speed;

    let raf = 0, time = 3, ignite = 0, light = lightRef.current ? 1 : 0, last = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const goal = activeRef.current ? 1 : 0;
      ignite += (goal - ignite) * Math.min(1, dt * 2.5);
      light += ((lightRef.current ? 1 : 0) - light) * Math.min(1, dt * 6);
      time += dt * spd;

      if (ignite < 0.002 && goal === 0) {
        gl.clear(gl.COLOR_BUFFER_BIT);
      } else {
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, time);
        gl.uniform1f(uIgnite, ignite);
        gl.uniform1f(uLight, light);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      raf = requestAnimationFrame(loop);
    };

    const play = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()));
    io.observe(canvas);
    resize();

    return () => {
      pause();
      ro.disconnect();
      io.disconnect();
    };
  }, [color, speed, intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        display: 'block', zIndex: 0, pointerEvents: 'none', borderRadius: 'inherit',
      }}
    />
  );
}
