import * as THREE from 'three'
import { addDefaultMeshes, addStandardMesh, addBase } from './addDefaultMeshes.js'
import { lightYellow, lightRed, lightSun } from './addLight.js'
import Model from './model.js'
import { manager } from './manager.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { addText } from './addText.js'
import { addModels } from './addModels.js'
import { addIsland } from './addIsland.js'
import gsap from 'gsap'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(16, window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.set(-5, 38, 45)
// camera.position.set(2, 1, 46)
// camera.position.set(0, 100, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
// renderer.outputEncoding = THREE.sRGBEncoding;
// renderer.outputColorSpace = THREE.SRGBColorSpace;
// renderer.toneMapping = THREE.NoToneMapping;

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableZoom = false;
controls.enableRotate = false;
controls.target.set(9, 1, 0)

controls.update()

const meshes = {}
const texts = {}
const models = {}
const lights = {}
const islands = []


const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const clock = new THREE.Clock()

// Scroll rotation variables for islands
let scrollRotationAngle = 0
const scrollRotationSpeed = 0.02 // Adjust this to control rotation speed
const rotationCenter = new THREE.Vector3(0, 0, 0) // Center point to rotate islands around
let islandData = [] // Store initial island positions and angles

// loading 
const loadingScreen = document.getElementById('loading-screen')
const loadingPercentage = document.getElementById('loading-percentage')

function handleLoadingProgress(progress, itemsLoaded, itemsTotal) {
	if (loadingPercentage) {
		if (itemsTotal > 0) {
			loadingPercentage.textContent = `${Math.round(progress)}%`
		} else {
			loadingPercentage.textContent = '0%'
		}
	}
}

let loadingTimeout = null

function handleLoadingComplete() {
	if (loadingTimeout) {
		clearTimeout(loadingTimeout)
		loadingTimeout = null
	}

	if (loadingScreen) {
		loadingScreen.classList.add('hidden')
	}
	if (renderer && renderer.domElement) {
		renderer.domElement.classList.add('loaded')
	}
	setTimeout(() => {
		if (loadingScreen) {
			loadingScreen.style.display = 'none'
		}
	}, 500)
}

const loadingManager = manager(handleLoadingProgress, handleLoadingComplete)

loadingTimeout = setTimeout(() => {
	console.warn('Loading timeout reached, hiding loading screen')
	if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
		handleLoadingComplete()
	}
}, 30000)


init()
function init() {
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	setTimeout(() => {
		if (renderer && renderer.domElement && !renderer.domElement.classList.contains('loaded')) {
			renderer.domElement.classList.add('loaded')
		}
	}, 1000)

	meshes.default = addDefaultMeshes({ xPos: 0, yPos: -0.8, zPos: 0 })
	scene.add(meshes.default)

	lights.yellow = lightYellow(scene)
	lights.red = lightRed(scene)
	lights.sun = lightSun(scene)

	models.landMain = addModels(scene, 'landMain', new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(1, 1, 1), loadingManager, meshes)
	models.add = addModels(scene, 'add', new THREE.Vector3(1.25, 0.5, 4),
		new THREE.Vector3(1, 1, 1), loadingManager, meshes)

	addIslands()
	setupScrollRotation()
	raycast()
	animate()
}

async function addIslands() {
	const userIslands = window.userIslands || []

	if (userIslands.length === 0) {
		console.warn('No islands found for user')
		return
	}

	let islandCount = userIslands.length
	let radius = 6.5
	let height = 0
	let radius2 = 11
	let smallRadiusMemoryCount = 8
	let largeRadiusMemoryCount = 12

	for (let i = 0; i < smallRadiusMemoryCount; i++) {
		let angle = i * (Math.PI * 2) / smallRadiusMemoryCount - (Math.PI / 2)
		let x = Math.cos(angle) * radius
		let z = Math.sin(angle) * radius
		let y = height
		islands.island = addIsland(userIslands[i].name, scene, new THREE.Vector3(x, y, z), new THREE.Vector3(1, 1, 1), loadingManager, meshes, userIslands[i].color, userIslands[i].model)
	}

	if (islandCount > smallRadiusMemoryCount - 1) {
		for (let i = 0; i < islandCount - (smallRadiusMemoryCount - 1); i++) {
			let angle = i * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .2)
			let x = Math.cos(angle) * radius2
			let z = Math.sin(angle) * radius2
			let y = height
			islands.island = addIsland(userIslands[i + (smallRadiusMemoryCount - 1)].name, scene, new THREE.Vector3(x, y, z), new THREE.Vector3(1, 1, 1), loadingManager, meshes, userIslands[i + (smallRadiusMemoryCount - 1)].color, userIslands[i + (smallRadiusMemoryCount - 1)].model)
		}
	}
	console.log('scene.children',islands.island)
}

let hitAdd = null
let isHoveringAdd = false
let hitIslandGroup = null
let isHoveringIsland = false

const ADD_ORIGINAL_Y_POSITION = 0.5
const ADD_HOVER_Y_POSITION = 0.3
const ISLAND_ORIGINAL_Y_POSITION = 0
const ISLAND_HOVER_Y_POSITION = -0.3

function raycast() {
	window.addEventListener('click', () => {
		pointer.x = (event.clientX / window.innerWidth) * 2 - 1
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
		raycaster.setFromCamera(pointer, camera)

		const intersects = raycaster.intersectObjects(scene.children, true)

		if (intersects.length > 0) {
			// for (let i = 0; i < intersects.length; i++) {
			let object = intersects[0].object
			while (object) {
				if (object.userData && object.userData.groupName === 'add') {
					window.location.href = '/add-island'
					break
				}
				// console.log('object',object)
				if (object.userData && object.userData.groupName === 'island') {
					window.location.href = '/add-island'
					console.log('islandGroup')
					// return
				}

				object = object.parent

			}

		}
	})

	window.addEventListener('mousemove', (event) => {
		pointer.x = (event.clientX / window.innerWidth) * 2 - 1
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
		raycaster.setFromCamera(pointer, camera)

		const intersects = raycaster.intersectObjects(scene.children, true)
		let foundIsland = false
		let currentIslandGroup = null
		let foundAdd = false

		if (intersects.length > 0) {
			for (let i = 0; i < intersects.length; i++) {
				let object = intersects[i].object
				while (object) {
					if (object.userData && object.userData.groupName === 'add') {
						console.log('add')
						foundAdd = true
						if (!isHoveringAdd) {
							hitAdd = object
							isHoveringAdd = true
							gsap.to(hitAdd.position, {
								y: ADD_HOVER_Y_POSITION,
								duration: 0.3,
								ease: 'power2.inOut'
							})
						}
						break
					}
		
					if (object.userData && object.userData.groupName === 'island') {
						currentIslandGroup = object
						foundIsland = true
						break
					}
					if (object.userData && (object.userData.groupName === 'islandTop' || object.userData.groupName === 'islandBase')) {
						let parent = object.parent
						while (parent) {
							if (parent.userData && parent.userData.groupName === 'island') {
								currentIslandGroup = parent
								foundIsland = true
								break
							}
							parent = parent.parent
						}
						if (foundIsland) break
					}
					object = object.parent
					if (!object) break
				}
			}
		}

		if (!foundAdd && isHoveringAdd && hitAdd) {
			isHoveringAdd = false
			gsap.to(hitAdd.position, {
				y: ADD_ORIGINAL_Y_POSITION,
				duration: 0.3,
				ease: 'power2.inOut'
			})
		}

		if (foundIsland && currentIslandGroup) {
			if (!isHoveringIsland || currentIslandGroup !== hitIslandGroup) {
				if (isHoveringIsland && hitIslandGroup && hitIslandGroup !== currentIslandGroup) {
					gsap.to(hitIslandGroup.position, {
						y: hitIslandGroup.userData.originalY,
						duration: 0.3,
						ease: 'power2.inOut'
					})
				}
				hitIslandGroup = currentIslandGroup
				isHoveringIsland = true
				gsap.to(hitIslandGroup.position, {
					y: ISLAND_HOVER_Y_POSITION,
					duration: 0.3,
					ease: 'power2.inOut'
				})
			}
		} else if (!foundIsland && isHoveringIsland && hitIslandGroup) {
			isHoveringIsland = false
			gsap.to(hitIslandGroup.position, {
				y: hitIslandGroup.userData.originalY,
				duration: 0.3,
				ease: 'power2.inOut'
			})
		}
	})

	window.addEventListener('mouseleave', () => {
		if (isHoveringAdd && hitAdd) {
			isHoveringAdd = false
			gsap.to(hitAdd.position, {
				y: ADD_ORIGINAL_Y_POSITION,
				duration: 0.3,
				ease: 'power2.inOut'
			})
			hitAdd = null
		}
		if (isHoveringIsland && hitIslandGroup) {
			isHoveringIsland = false
			gsap.to(hitIslandGroup.position, {
				y: hitIslandGroup.userData.originalY,
				duration: 0.3,
				ease: 'power2.inOut'
			})
			hitIslandGroup = null
		}
	})
}

function setupScrollRotation() {
	window.addEventListener('wheel', (event) => {
		scrollRotationAngle += event.deltaY * scrollRotationSpeed
	}, { passive: true })
}

function animate() {
	const delta = clock.getDelta()

	controls.update()
	requestAnimationFrame(animate)
	renderer.render(scene, camera)

	// console.log(scene.children)
}

function handleResize() {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
}

window.addEventListener('resize', handleResize);