import * as THREE from 'three'

export const lightYellow = (scene) => {
	const light = new THREE.PointLight(0xFFBF99, 300)
	light.position.set(16, 20, 3)
	light.rotation.set(THREE.MathUtils.degToRad(250), THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(0))

	scene.add(light)

	return light
}

export const lightRed = (scene) => {
	const light = new THREE.PointLight(0xFF9E8A, 400)
	light.position.set(-10, 20, 10)

	scene.add(light)

	return light
}

export const lightSun = (scene) => {
	const light = new THREE.DirectionalLight(0xffffff, 2.5)
	light.position.set(-2, 14, 5)
	light.rotation.set(THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(-30), THREE.MathUtils.degToRad(-30))

	scene.add(light)

	return light
}