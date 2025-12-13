'use client'

import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

interface ThreeViewerProps {
  modelUrl: string
  textureUrl?: string
}

function CarModel({ modelUrl, textureUrl }: { modelUrl: string; textureUrl?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!meshRef.current || !textureUrl) return

    const loader = new THREE.TextureLoader()
    loader.load(textureUrl, (texture) => {
      texture.flipY = false
      if (meshRef.current?.material) {
        ;(meshRef.current.material as THREE.MeshStandardMaterial).map = texture
        ;(meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true
      }
    })
  }, [textureUrl])

  // For now, create a simple placeholder mesh
  // In production, load the actual GLB/OBJ model
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <boxGeometry args={[2, 1, 4]} />
      <meshStandardMaterial
        color="#3b82f6"
        map={textureUrl ? new THREE.TextureLoader().load(textureUrl) : undefined}
      />
    </mesh>
  )
}

export default function ThreeViewer({ modelUrl, textureUrl }: ThreeViewerProps) {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        <CarModel modelUrl={modelUrl} textureUrl={textureUrl} />
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  )
}







