'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

// --- Equatorial Disk Shaders ---
const eqVertexShader = `
  varying vec3 vLocalPosition;
  varying float vAngle;
  varying float vRadius;

  void main() {
    vLocalPosition = position;
    vRadius = length(position.xy);
    vAngle = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const eqFragmentShader = `
  varying vec3 vLocalPosition;
  varying float vAngle;
  varying float vRadius;
  uniform float uTime;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * valNoise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float r = vRadius;
    float theta = vAngle;
    
    // Radius normalized between rIn (1.15) and rOut (4.2)
    float rIn = 1.15;
    float rOut = 4.2;
    float rNorm = (r - rIn) / (rOut - rIn);
    if (rNorm < 0.0 || rNorm > 1.0) discard;
    
    // Rotational flow: slowed down Keplerian
    float speed = 0.6 / sqrt(r);
    float flowAngle = theta - uTime * speed;
    
    vec2 noiseCoords = vec2(flowAngle * 3.5, rNorm * 9.0);
    float n = fbm(noiseCoords);
    
    // High-frequency bristle structure for a painterly brush-stroke look
    float bristle = 0.5 + 0.5 * sin(rNorm * 180.0 + n * 8.0);
    float painterlyNoise = mix(n, bristle, 0.4);
    
    // Slowed down fine-scale shimmering
    float shimmer = 0.96 + 0.04 * sin(theta * 10.0 + uTime * 3.0);
    
    // Asymmetrical boundary fade: sharp inner edge, smooth outer decay
    float innerFade = smoothstep(0.0, 0.08, rNorm);
    float outerFade = pow(1.0 - rNorm, 2.5);
    float edgeFade = innerFade * outerFade;
    
    float brightness = (painterlyNoise * 0.8 + 0.2) * edgeFade * shimmer;
    
    // Color Palette: White core, Silver-blue mid-body, Copper-orange outer dust
    vec3 coreColor   = vec3(1.0, 1.0, 1.0);       // Brilliant white
    vec3 midColor    = vec3(0.85, 0.90, 1.0);     // Silver-blue
    vec3 copperColor = vec3(0.48, 0.24, 0.08);    // Rich copper-orange
    
    // Copper color appears at the outer boundaries of the flat disk on the sides
    float horizWeight = pow(cos(theta), 2.0); // 1.0 at sides (0 or PI), 0.0 at top/bottom (PI/2)
    float copperWeight = pow(rNorm, 1.5) * horizWeight * 0.95;
    
    vec3 color = mix(coreColor, midColor, rNorm * 0.4);
    color = mix(color, copperColor, copperWeight);
    
    gl_FragColor = vec4(color * brightness * 2.8, brightness * 0.95);
  }
`

// --- Upper Arch Shaders ---
const upperVertexShader = `
  varying vec3 vLocalPosition;
  varying float vAngle;
  varying float vRadius;

  void main() {
    vLocalPosition = position;
    vRadius = length(position.xy);
    vAngle = atan(position.y, position.x);

    vec3 pos = position;
    // Warp depth (z) to curve behind the black hole
    // Starts at z = 0 at the sides and peaks at z = -1.2 at the top
    float sinTheta = sin(vAngle);
    pos.z = -1.2 * sinTheta * (vRadius / 2.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const upperFragmentShader = `
  varying vec3 vLocalPosition;
  varying float vAngle;
  varying float vRadius;
  uniform float uTime;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * valNoise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float r = vRadius;
    float theta = vAngle;
    
    // Radius normalized between rIn (1.05) and rOut (2.0)
    float rIn = 1.05;
    float rOut = 2.0;
    float rNorm = (r - rIn) / (rOut - rIn);
    if (rNorm < 0.0 || rNorm > 1.0) discard;
    
    // Rotational flow: slowed down Keplerian
    float speed = 0.65 / sqrt(r);
    float flowAngle = theta - uTime * speed;
    
    vec2 noiseCoords = vec2(flowAngle * 3.5, rNorm * 8.0);
    float n = fbm(noiseCoords);
    
    // Concentric filament lines (bristle texture)
    float bristle = 0.5 + 0.5 * sin(rNorm * 120.0 + n * 6.0);
    float painterlyNoise = mix(n, bristle, 0.35);
    
    // Fine-scale shimmering
    float shimmer = 0.95 + 0.05 * sin(theta * 8.0 + uTime * 3.0);
    
    // Arch boundary fade
    float innerFade = smoothstep(0.0, 0.08, rNorm);
    float outerFade = pow(1.0 - rNorm, 2.0);
    float edgeFade = innerFade * outerFade;
    
    float brightness = (painterlyNoise * 0.75 + 0.25) * edgeFade * shimmer;
    
    vec3 coreColor   = vec3(1.0, 1.0, 1.0);
    vec3 midColor    = vec3(0.85, 0.90, 1.0);
    vec3 copperColor = vec3(0.48, 0.24, 0.08);
    
    // Blend to copper on the outer tips where it merges with the flat disk
    float horizWeight = pow(cos(theta), 2.0);
    float copperWeight = pow(rNorm, 1.5) * horizWeight * 0.9;
    
    vec3 color = mix(coreColor, midColor, rNorm * 0.4);
    color = mix(color, copperColor, copperWeight);
    
    gl_FragColor = vec4(color * brightness * 2.8, brightness * 0.95);
  }
`

// --- Lower Arch Shaders ---
const lowerVertexShader = `
  varying vec3 vLocalPosition;
  varying float vAngle;
  varying float vRadius;

  void main() {
    // Negate y to make it curve downwards
    vec3 pos = position;
    pos.y = -pos.y;

    vLocalPosition = pos;
    vRadius = length(pos.xy);
    vAngle = atan(pos.y, pos.x);

    // Warp depth (z) to curve behind the black hole
    // sin(vAngle) is negative, pos.z will be negative (behind)
    float sinTheta = sin(vAngle);
    pos.z = 1.2 * sinTheta * (vRadius / 2.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const lowerFragmentShader = `
  varying vec3 vLocalPosition;
  varying float vAngle;
  varying float vRadius;
  uniform float uTime;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * valNoise(p);
      p = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float r = vRadius;
    float theta = vAngle;
    
    // Radius normalized between rIn (1.05) and rOut (1.8)
    float rIn = 1.05;
    float rOut = 1.8;
    float rNorm = (r - rIn) / (rOut - rIn);
    if (rNorm < 0.0 || rNorm > 1.0) discard;
    
    // Rotational flow: slowed down Keplerian
    float speed = 0.65 / sqrt(r);
    float flowAngle = theta - uTime * speed;
    
    vec2 noiseCoords = vec2(flowAngle * 3.5, rNorm * 8.0);
    float n = fbm(noiseCoords);
    
    // Concentric filament lines (bristle texture)
    float bristle = 0.5 + 0.5 * sin(rNorm * 120.0 + n * 6.0);
    float painterlyNoise = mix(n, bristle, 0.35);
    
    // Fine-scale shimmering
    float shimmer = 0.95 + 0.05 * sin(theta * 8.0 + uTime * 3.0);
    
    // Arch boundary fade
    float innerFade = smoothstep(0.0, 0.08, rNorm);
    float outerFade = pow(1.0 - rNorm, 2.0);
    float edgeFade = innerFade * outerFade;
    
    float brightness = (painterlyNoise * 0.75 + 0.25) * edgeFade * shimmer;
    
    vec3 coreColor   = vec3(1.0, 1.0, 1.0);
    vec3 midColor    = vec3(0.85, 0.90, 1.0);
    vec3 copperColor = vec3(0.48, 0.24, 0.08);
    
    // Blend to copper on the outer tips where it merges with the flat disk
    float horizWeight = pow(cos(theta), 2.0);
    float copperWeight = pow(rNorm, 1.5) * horizWeight * 0.9;
    
    vec3 color = mix(coreColor, midColor, rNorm * 0.4);
    color = mix(color, copperColor, copperWeight);
    
    gl_FragColor = vec4(color * brightness * 2.8, brightness * 0.95);
  }
`

// --- Photon Boundary Ring Shaders ---
const photonVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const photonFragmentShader = `
  varying vec2 vUv;
  void main() {
    // Sharp glow peaking at the center of the photon ring thickness
    float alpha = sin(vUv.y * 3.14159);
    alpha = pow(alpha, 1.5);
    gl_FragColor = vec4(vec3(1.5), alpha * 0.9);
  }
`

export default function AccretionDisk() {
  const eqMatRef = useRef<THREE.ShaderMaterial>(null)
  const upperMatRef = useRef<THREE.ShaderMaterial>(null)
  const lowerMatRef = useRef<THREE.ShaderMaterial>(null)
  const eqMeshRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  useFrame((state, delta) => {
    let progress = 0
    if (typeof window !== 'undefined') {
      progress = (window as typeof window & { workspacex_scrollProgress?: number }).workspacex_scrollProgress || 0
    }

    // Temporary speed boost during scroll (peaking in the middle of transition)
    const speedBoost = 1.0 + 2.5 * Math.sin(progress * Math.PI)
    timeRef.current += delta * speedBoost

    const time = timeRef.current
    if (eqMatRef.current) {
      eqMatRef.current.uniforms.uTime.value = time
    }
    if (upperMatRef.current) {
      upperMatRef.current.uniforms.uTime.value = time
    }
    if (lowerMatRef.current) {
      lowerMatRef.current.uniforms.uTime.value = time
    }

    // Rotate and warp the tilt slightly as we scroll
    if (eqMeshRef.current) {
      eqMeshRef.current.rotation.x = 1.45 - progress * 0.15
      eqMeshRef.current.rotation.z = -0.28 - progress * 0.18
    }
  })

  return (
    <group>
      {/* 1. Front Equatorial Disk (semi-ring crossing in front) */}
      <mesh
        ref={eqMeshRef}
        rotation={[1.45, 0, -0.28]}
        renderOrder={2}
      >
        <ringGeometry args={[1.15, 4.2, 128, 1, 0, Math.PI]} />
        <shaderMaterial
          ref={eqMatRef}
          vertexShader={eqVertexShader}
          fragmentShader={eqFragmentShader}
          uniforms={{ uTime: { value: 0 } }}
          transparent={true}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Upper Lensed Arch (lensed dome curving behind the horizon) */}
      <mesh renderOrder={2}>
        <ringGeometry args={[1.05, 2.0, 128, 1, 0, Math.PI]} />
        <shaderMaterial
          ref={upperMatRef}
          vertexShader={upperVertexShader}
          fragmentShader={upperFragmentShader}
          uniforms={{ uTime: { value: 0 } }}
          transparent={true}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Lower Lensed Arch (lensed dome curving downwards behind the horizon) */}
      <mesh renderOrder={2}>
        <ringGeometry args={[1.05, 1.8, 128, 1, 0, Math.PI]} />
        <shaderMaterial
          ref={lowerMatRef}
          vertexShader={lowerVertexShader}
          fragmentShader={lowerFragmentShader}
          uniforms={{ uTime: { value: 0 } }}
          transparent={true}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Event Horizon Photon Ring (thin glowing circle wrapping the edge) */}
      <mesh renderOrder={2}>
        <ringGeometry args={[1.01, 1.04, 128, 1]} />
        <shaderMaterial
          vertexShader={photonVertexShader}
          fragmentShader={photonFragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
