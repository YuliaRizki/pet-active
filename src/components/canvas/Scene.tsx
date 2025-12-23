'use client'

import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { SheetProvider, editable as e } from '@theatre/r3f'
import { getProject } from '@theatre/core'
import * as THREE from 'three'
import { ScrollControls, useTexture } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  Scanline,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { styled, setup } from 'goober'
import projectState from '@/lib/state.json'
import './CardMaterial'

// Initialize Goober for Next.js
setup(React.createElement)

// 1. Project Configuration
const PROJECTS = [
  { id: 1, title: 'CONCERT SERIES', image: '/card-bg.jpg' },
  { id: 2, title: 'DIGITAL FASHION', image: '/fashion-bg.png' },
  { id: 3, title: 'SPACE EXPLORER', image: '/space-bg.png' },
]

const project = getProject('ActiveClone', { state: projectState })
const sheet = project.sheet('MainScene')

// 2. Styled Components
const Title = styled('h1')`
  position: absolute;
  top: 15%;
  left: 10%;
  font-size: 8vw;
  font-weight: 900;
  color: white;
  z-index: 10;
  pointer-events: none;
  mix-blend-mode: difference;
  transition: transform 0.1s ease-out;
`

const Cursor = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border: 2px solid white;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  transition: width 0.3s ease, height 0.3s ease, background 0.3s ease;

  &.hovering {
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
  }
`

const MenuButton = styled('button')`
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  z-index: 1000;
  font-weight: 600;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  cursor: none;

  &:hover {
    background: white;
    color: black;
  }
`

const GlassOverlay = styled('div')`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(15px);
  opacity: 0;
  pointer-events: none;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease-in-out;

  &.open {
    opacity: 1;
    pointer-events: auto;
  }
`

// 3. Helper Components
function CustomCursor({ isHovering }: { isHovering: boolean }) {
  const cursorRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        const offset = isHovering ? 50 : 20
        cursorRef.current.style.transform = `translate3d(${e.clientX - offset}px, ${
          e.clientY - offset
        }px, 0)`
      }
    }
    window.addEventListener('mousemove', moveCursor)
    return () => window.removeEventListener('mousemove', moveCursor)
  }, [isHovering])

  return <Cursor ref={cursorRef} className={isHovering ? 'hovering' : ''} />
}

function AnimatedCard({ texturePath }: { texturePath: string }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<any>(null)
  const hoverValue = useRef(0)
  const [expanded, setExpanded] = useState(false)
  const texture = useTexture(texturePath)

  useFrame((state) => {
    const { mouse, clock } = state
    const t = clock.elapsedTime

    if (materialRef.current) {
      materialRef.current.uHover = THREE.MathUtils.lerp(
        materialRef.current.uHover || 0,
        hoverValue.current,
        0.1,
      )
      materialRef.current.uTime = t
    }

    if (meshRef.current) {
      // Tilt logic
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        -mouse.y * 0.3,
        0.1,
      )
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        mouse.x * 0.3,
        0.1,
      )

      // Floating motion
      meshRef.current.position.y = Math.sin(t * 0.5) * 0.1

      // Scale logic
      const targetScale = expanded ? 2.2 : 1
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1),
      )
    }
  })

  return (
    <e.mesh
      theatreKey="MainCard"
      ref={meshRef}
      onClick={() => setExpanded(!expanded)}
      onPointerOver={() => (hoverValue.current = 1)}
      onPointerOut={() => (hoverValue.current = 0)}
    >
      <planeGeometry args={[3, 4, 32, 32]} />
      {/* @ts-ignore */}
      <cardMaterial ref={materialRef} uTexture={texture} transparent />
    </e.mesh>
  )
}

// 4. Main Scene Component
export default function Scene() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [menuOpen, setMenuOpen] = useState(false)
  const [isHoveringLink, setIsHoveringLink] = useState(false)
  const [activeProject, setActiveProject] = useState(PROJECTS[0])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      project.ready.then(() => {
        sheet.sequence.play({ iterationCount: Infinity, range: [0, 2] })
      })
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    setParallax({
      x: (e.clientX / window.innerWidth - 0.5) * 50,
      y: (e.clientY / window.innerHeight - 0.5) * 50,
    })
  }

  return (
    <div onMouseMove={handleMouseMove} className="fixed inset-0 z-0 bg-black overflow-hidden">
      <CustomCursor isHovering={isHoveringLink} />

      <MenuButton onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'CLOSE' : 'MENU'}</MenuButton>

      <GlassOverlay className={menuOpen ? 'open' : ''}>
        <div
          onMouseEnter={() => setIsHoveringLink(true)}
          onMouseLeave={() => setIsHoveringLink(false)}
          style={{ color: 'white', fontSize: '4vw', textAlign: 'center', fontWeight: 900 }}
        >
          {PROJECTS.map((p) => (
            <p
              key={p.id}
              onClick={() => {
                setActiveProject(p)
                setMenuOpen(false)
              }}
              style={{ margin: '1rem 0', cursor: 'pointer' }}
            >
              {p.title}
            </p>
          ))}
        </div>
      </GlassOverlay>

      <Title style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}>
        {activeProject.title}
      </Title>

      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} style={{ cursor: 'none' }}>
        <Suspense fallback={null}>
          <ScrollControls pages={3} damping={0.2}>
            <SheetProvider sheet={sheet}>
              <AnimatedCard texturePath={activeProject.image} />

              <EffectComposer>
                <Bloom luminanceThreshold={1.0} mipmapBlur intensity={1.5} radius={0.4} />
                <Scanline opacity={0.1} density={1.2} />
                <Noise opacity={0.05} />
                <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
                <Vignette offset={0.3} darkness={0.9} />
              </EffectComposer>
            </SheetProvider>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  )
}
