"use client";

// The two shader backgrounds used on the site, with the exact settings from Framer.

import ShaderBackground, { rgba } from "./ShaderBackground";

const BANDS_UNIFORMS = {
  u_colors: [...rgba("rgb(0, 0, 0)"), ...rgba("rgb(0, 77, 68)"), ...Array(24).fill(0)],
  u_colors_length: 2,
  u_seed: 858,
  u_speed: 0.42,
  u_ephemeralAmp: 0,
  u_lensScale: 0.8,
  u_lensSpacingX: 1,
  u_lensSpacingY: 0.01,
  u_lensRadius: 0.16,
  u_dispersionStrength: 0,
  u_edgeDisp: 0,
};

const MESH_UNIFORMS = {
  u_backgroundColor: rgba("#000000"),
  u_lineColor: rgba("#FFFFFF"),
  u_lineWidth: 0.1,
  u_lineBlur: 2,
  u_seed: 200,
  u_speed: 0.5,
  u_amplitude: 0.2,
  u_tilt: -32,
  u_zoom: 0.35,
  u_cameraHeight: 2,
  u_lightIntensity: 3,
};

/** Dark-green flowing bands behind the "Ready to check it out?" section. */
export function BandsBackground() {
  return (
    <ShaderBackground
      shader="bands"
      uniforms={BANDS_UNIFORMS}
      fallback={{
        desktop: "/images/bands-desktop.png",
        tablet: "/images/bands-tablet.png",
        phone: "/images/bands-phone.png",
      }}
    />
  );
}

/** Animated wave lines behind the Give page. */
export function MeshBackground({ className }: { className?: string }) {
  return (
    <ShaderBackground
      shader="mesh"
      className={className}
      uniforms={MESH_UNIFORMS}
      fallback={{
        desktop: "/images/mesh-desktop.png",
        tablet: "/images/mesh-tablet.png",
        phone: "/images/mesh-phone.png",
      }}
    />
  );
}
