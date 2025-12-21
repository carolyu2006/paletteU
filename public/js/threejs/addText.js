import * as THREE from 'three'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'

export const addText = (scene, text, position) => {
	let textMesh = null;
	const fontLoader = new FontLoader()
	fontLoader.load('/threejs/font.json', (font) => {
		const textGeometry = new TextGeometry(text, {
			font: font,
			size: 0.4,
			height: 0.2,
			depth: 0.1,
			align: 'center',
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: 0.03,
			bevelSize: 0.02,
			bevelOffset: 0,
			bevelSegments: 5,
		})

		textGeometry.computeBoundingBox()
		textGeometry.center()

		textMesh = new THREE.Mesh(textGeometry, new THREE.MeshStandardMaterial({
			color: 0xffffff,
			metalness: 0,
			roughness: 1,
		}))
		
		textMesh.position.set(position.x, position.y-1.2, position.z)
		textMesh.rotation.set(THREE.MathUtils.degToRad(-90), THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(0))
		scene.add(textMesh)
	})

	return textMesh
}