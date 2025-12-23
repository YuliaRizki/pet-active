import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const CardMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: new THREE.Texture(),
    uHover: 0,
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform float uHover; 
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uTime;

  void main() {
    vec2 uv = vUv;
    
    // Create a wavy distortion that only happens when uHover > 0
    float wave = sin(uv.y * 10.0 + uTime) * 0.05 * uHover;
    vec2 distortedUv = vec2(uv.x + wave, uv.y);
    
    vec4 color = texture2D(uTexture, distortedUv);
    
    // Add a slight brightness boost on hover
    color.rgb += uHover * 0.1;
    
    gl_FragColor = color;
  }
  `,
)

extend({ CardMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cardMaterial: any
    }
  }
}

export default CardMaterial
