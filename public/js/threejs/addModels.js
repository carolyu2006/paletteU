import * as THREE from 'three'
import Model from './model.js'

export const addModels = (scene, meshName, position, scale, loadingManager, meshes, mixers) => {
	if (meshName === 'paletteU') {
		return addPaletteU(scene, position, scale, loadingManager, meshes, mixers)
	}
	if (meshName === 'landMain') {
		return addLandMain(scene, position, scale, loadingManager, meshes, mixers)
	}
	if (meshName === 'paletteULogo') {
		return addPaletteULogo(scene, position, scale, loadingManager, meshes, mixers)
	}
	if (meshName === 'add') {
		return addAdd(scene, position, scale, loadingManager, meshes, mixers)
	}
}

function addAdd(scene, position, scale, loadingManager, meshes, mixers) {
	const add = new Model({
		name: 'add',
		url: '/threejs/add.glb',
		scene: scene,
		meshes: meshes,
		animationState: false,
		mixers: mixers,
		scale: new THREE.Vector3(scale.x, scale.y, scale.z),
		position: new THREE.Vector3(position.x, position.y, position.z),
		manager: loadingManager,
	})

	add.init()
	return add
}

function addLandMain(scene, position, scale, loadingManager, meshes, mixers) {
	const landMain = new Model({
		name: 'landMain',
		url: '/threejs/landmain.glb',
		scene: scene,
		meshes: meshes,
		animationState: false,
		mixers: mixers,
		scale: new THREE.Vector3(scale.x, scale.y, scale.z),
		position: new THREE.Vector3(position.x, position.y, position.z),
		manager: loadingManager,
	})
	landMain.init()
	return landMain
}

function addPaletteU(scene, position, scale, loadingManager, meshes, mixers) {
	const paletteU = new Model({
		name: 'paletteU',
		url: '/threejs/paletteU.glb',
		scene: scene,
		meshes: meshes,
		animationState: false,
		mixers: mixers,
		scale: new THREE.Vector3(scale.x, scale.y, scale.z),
		position: new THREE.Vector3(position.x, position.y, position.z),
		replace: false,
		manager: loadingManager,
	})

	paletteU.init()
	return paletteU
}

function addPaletteULogo(scene, position, scale, loadingManager, meshes, mixers) {
	const paletteULogo = new Model({
		name: 'paletteULogo',
		url: '/threejs/paletteULogo.glb',
		scene: scene,
		meshes: meshes,
		animationState: false,
		mixers: mixers,
		scale: new THREE.Vector3(scale.x, scale.y, scale.z),
		position: new THREE.Vector3(position.x, position.y, position.z),
		replace: false,
		manager: loadingManager,
	})

	paletteULogo.init()
	return paletteULogo
}