"use client";

// Runs Framer's built-in shaders with WebGL2. While the shader loads (or if
// WebGL is unavailable / reduced motion is on) the static fallback image
// Framer rendered for each breakpoint is shown instead.

import { useEffect, useRef } from "react";
import { BANDS_FRAG, MESH_FRAG } from "@/lib/shaders";

type Uniform = number | number[];

const SHADERS = {
  bands: {
    body: BANDS_FRAG,
    decls: `uniform vec4 u_colors[8];
uniform int u_colors_length;
uniform float u_seed, u_speed, u_ephemeralAmp, u_lensScale, u_lensSpacingX, u_lensSpacingY, u_lensRadius, u_dispersionStrength, u_edgeDisp;`,
    // Soft gradient: render at reduced resolution to keep it light.
    scale: 0.5,
  },
  mesh: {
    body: MESH_FRAG,
    decls: `uniform vec4 u_backgroundColor, u_lineColor;
uniform float u_lineWidth, u_lineBlur, u_seed, u_speed, u_amplitude, u_tilt, u_zoom, u_cameraHeight, u_lightIntensity;`,
    scale: 1,
  },
} as const;

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

type Props = {
  shader: keyof typeof SHADERS;
  uniforms: Record<string, Uniform>;
  /** Fallback images per breakpoint, as Framer exported them. */
  fallback: { desktop: string; tablet: string; phone: string };
  className?: string;
  style?: React.CSSProperties;
};

export default function ShaderBackground({ shader, uniforms, fallback, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: false, antialias: false });
    if (!gl) return;

    const def = SHADERS[shader];
    const frag = `#version 300 es
precision highp float;
precision highp int;
in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_pixelRatio;
${def.decls}
${def.body}`;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("Shader compile failed:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const [name, value] of Object.entries(uniforms)) {
      const u = gl.getUniformLocation(prog, name);
      if (!u) continue;
      if (typeof value === "number") {
        if (name.endsWith("_length")) gl.uniform1i(u, value);
        else gl.uniform1f(u, value);
      } else gl.uniform4fv(u, value); // a vec4, or a flattened vec4 array
    }
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRatio = gl.getUniformLocation(prog, "u_pixelRatio");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * def.scale;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uRatio, dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);

    const start = performance.now();
    let raf = 0;
    let shown = false;
    const frame = (now: number) => {
      if (!visible) return;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
      raf = requestAnimationFrame(frame);
    };
    frame(start);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      // Free GPU objects but keep the context: the canvas may be reused on remount.
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [shader, uniforms]);

  return (
    <div
      className={`shader ${className ?? ""}`}
      style={
        {
          ...style,
          "--fb-desktop": `url(${fallback.desktop})`,
          "--fb-tablet": `url(${fallback.tablet})`,
          "--fb-phone": `url(${fallback.phone})`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

/** "rgb(0, 77, 68)" or "#000000" → [r, g, b, a] in 0..1 */
export function rgba(color: string): number[] {
  if (color.startsWith("#")) {
    const n = parseInt(color.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
  }
  const [r, g, b, a = 1] = color.match(/[\d.]+/g)!.map(Number);
  return [r / 255, g / 255, b / 255, a];
}
