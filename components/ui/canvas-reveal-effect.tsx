"use client";
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

type Uniforms = { [key: string]: { value: number[] | number[][] | number; type: string } };

const ShaderMaterial = ({ source, uniforms }: { source: string; uniforms: Uniforms }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ref.current.material as any).uniforms.u_time.value = clock.getElapsedTime();
  });

  const material = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prepared: any = {};
    for (const name in uniforms) {
      const u = uniforms[name];
      switch (u.type) {
        case "uniform1f":   prepared[name] = { value: u.value }; break;
        case "uniform1i":   prepared[name] = { value: u.value }; break;
        case "uniform1fv":  prepared[name] = { value: u.value }; break;
        case "uniform3fv":  prepared[name] = { value: (u.value as number[][]).map(v => new THREE.Vector3().fromArray(v)) }; break;
        default: break;
      }
    }
    prepared.u_time = { value: 0 };
    prepared.u_resolution = { value: new THREE.Vector2(size.width * 2, size.height * 2) };

    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        in vec2 coordinates;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main(){
          gl_Position = vec4(position.xy, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }
      `,
      fragmentShader: source,
      uniforms: prepared,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source]); // eslint-disable-line

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const DotMatrix = ({
  colors = [[0, 255, 255]],
  opacities = [0.04,0.04,0.04,0.04,0.04,0.08,0.08,0.08,0.08,0.14],
  totalSize = 20,
  dotSize = 3,
  reverse = false,
  center = ["x", "y"] as ("x"|"y")[],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [colors[0],colors[0],colors[0],colors[0],colors[0],colors[0]];
    if (colors.length === 2) colorsArray = [colors[0],colors[0],colors[0],colors[1],colors[1],colors[1]];
    else if (colors.length === 3) colorsArray = [colors[0],colors[0],colors[1],colors[1],colors[2],colors[2]];
    return {
      u_colors: { value: colorsArray.map(c => [c[0]/255, c[1]/255, c[2]/255]), type: "uniform3fv" },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: reverse ? 1 : 0, type: "uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, reverse]);

  const source = `
    precision mediump float;
    in vec2 fragCoord;
    uniform float u_time;
    uniform float u_opacities[10];
    uniform vec3 u_colors[6];
    uniform float u_total_size;
    uniform float u_dot_size;
    uniform vec2 u_resolution;
    uniform int u_reverse;
    out vec4 fragColor;
    float PHI = 1.61803398874989484820459;
    float random(vec2 xy){ return fract(tan(distance(xy*PHI,xy)*0.5)*xy.x); }
    void main(){
      vec2 st = fragCoord.xy;
      ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
      ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}
      float opacity = step(0.0, st.x) * step(0.0, st.y);
      vec2 st2 = vec2(int(st.x/u_total_size), int(st.y/u_total_size));
      float show_offset = random(st2);
      float rand = random(st2 * floor((u_time/5.0) + show_offset + 5.0));
      opacity *= u_opacities[int(rand*10.0)];
      opacity *= 1.0 - step(u_dot_size/u_total_size, fract(st.x/u_total_size));
      opacity *= 1.0 - step(u_dot_size/u_total_size, fract(st.y/u_total_size));
      vec3 color = u_colors[int(show_offset*6.0)];
      vec2 center_grid = u_resolution/2.0/u_total_size;
      float dist = distance(center_grid, st2);
      float max_dist = distance(center_grid, vec2(0.0));
      float timing;
      if(u_reverse == 1){
        timing = (max_dist - dist)*0.02 + random(st2+42.0)*0.2;
        opacity *= 1.0 - step(timing, u_time*0.5);
      } else {
        timing = dist*0.01 + random(st2)*0.15;
        opacity *= step(timing, u_time*0.5);
      }
      fragColor = vec4(color, opacity);
      fragColor.rgb *= fragColor.a;
    }
  `;

  return <ShaderMaterial source={source} uniforms={uniforms} />;
};

export const CanvasRevealEffect = ({
  animationSpeed = 3,
  opacities = [0.3,0.3,0.3,0.5,0.5,0.5,0.8,0.8,0.8,1],
  colors = [[74, 222, 128]],
  containerClassName,
  dotSize = 4,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <Canvas className="absolute inset-0 h-full w-full">
          <DotMatrix colors={colors} opacities={opacities} dotSize={dotSize} reverse={reverse} />
        </Canvas>
      </div>
      {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />}
    </div>
  );
};
