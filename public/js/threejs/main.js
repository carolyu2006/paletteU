import * as THREE from 'three'
import { addDefaultMeshes, addStandardMesh, addBase } from './addDefaultMeshes.js'
import { lightYellow, lightRed, lightSun } from './addLight.js'
import { manager } from './manager.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { addModels } from './addModels.js'
import { addIsland, enableIslandGlow, disableIslandGlow } from './addIsland.js'
import gsap from 'gsap'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(7, window.innerWidth / window.innerHeight, 0.1, 1000)

camera.position.set(-24, 85, 100)
// camera.position.set(2, 1, 46)
// camera.position.set(-200, 300, 0)

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

let smallRadiusUserAddedCount = 0;
let largeRadiusUserAddedCount = 0;

let islandOrbitGroup = null

// Scroll navigation variables
let scrollDelta = 0
const SCROLL_THRESHOLD = 50
let islandGroups = []
let islandCurrentPositionIndices = [] // Track which position index each island is currently at within its circle
let islandCircleType = [] // Track which circle each island belongs to: 'small' or 'large'
let isScrolling = false

let radius = 12
let height = 0
let radius2 = 20
const smallRadiusMemoryCount = 8
const largeRadiusMemoryCount = 12

const islandAnglesSmall = [
	0 * (Math.PI * 2) / (smallRadiusMemoryCount + 1) - (Math.PI / 2 - .1),
	1 * (Math.PI * 2) / (smallRadiusMemoryCount + 1) - (Math.PI / 2 - .1),
	2 * (Math.PI * 2) / (smallRadiusMemoryCount + 1) - (Math.PI / 2 - .1),
	3 * (Math.PI * 2) / (smallRadiusMemoryCount + 1) - (Math.PI / 2 - .1),
	4 * (Math.PI * 2) / (smallRadiusMemoryCount + 1) - (Math.PI / 2 - .5),
	5 * (Math.PI * 2) / (smallRadiusMemoryCount + 1) - (Math.PI / 2 - .1),
	6 * (Math.PI * 2) / (smallRadiusMemoryCount + 1) - (Math.PI / 2 - .1),
	8 * (Math.PI * 2) / (smallRadiusMemoryCount + 1) - (Math.PI / 2 - .1),
]

const islandAnglesLarge = [
	0 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	1 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	2 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	3 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	4 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	5 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	6 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	7 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	8 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	9 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	10 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
	11 * (Math.PI * 2) / largeRadiusMemoryCount - (Math.PI / 8 + .15),
];

const islandPositionsSmall = [
	{ x: Math.cos(islandAnglesSmall[0]) * radius, y: 0, z: Math.sin(islandAnglesSmall[0]) * radius },
	{ x: Math.cos(islandAnglesSmall[1]) * radius, y: 0, z: Math.sin(islandAnglesSmall[1]) * radius },
	{ x: Math.cos(islandAnglesSmall[2]) * radius, y: 0, z: Math.sin(islandAnglesSmall[2]) * radius },
	{ x: Math.cos(islandAnglesSmall[3]) * radius, y: 0, z: Math.sin(islandAnglesSmall[3]) * radius },
	{ x: Math.cos(islandAnglesSmall[4]) * (radius + 2), y: 0, z: Math.sin(islandAnglesSmall[4]) * (radius + 2) },
	{ x: Math.cos(islandAnglesSmall[5]) * (radius + 2), y: 0, z: Math.sin(islandAnglesSmall[5]) * (radius + 2) },
	{ x: Math.cos(islandAnglesSmall[6]) * (radius + 2), y: 0, z: Math.sin(islandAnglesSmall[6]) * (radius + 2) },
	{ x: Math.cos(islandAnglesSmall[7]) * radius, y: 0, z: Math.sin(islandAnglesSmall[7]) * radius },
]

const islandPositionsLarge = [
	{ x: Math.cos(islandAnglesLarge[0]) * radius2, y: 0, z: Math.sin(islandAnglesLarge[0]) * radius2 },
	{ x: Math.cos(islandAnglesLarge[1]) * radius2, y: 0, z: Math.sin(islandAnglesLarge[1]) * radius2 },
	{ x: Math.cos(islandAnglesLarge[2]) * radius2, y: 0, z: Math.sin(islandAnglesLarge[2]) * radius2 },
	{ x: Math.cos(islandAnglesLarge[3]) * radius2, y: 0, z: Math.sin(islandAnglesLarge[3]) * radius2 },
	{ x: Math.cos(islandAnglesLarge[4]) * radius2, y: 0, z: Math.sin(islandAnglesLarge[4]) * radius2 },
	{ x: Math.cos(islandAnglesLarge[5]) * radius2, y: 0, z: Math.sin(islandAnglesLarge[5]) * radius2 },
	{ x: Math.cos(islandAnglesLarge[6]) * radius2, y: 0, z: Math.sin(islandAnglesLarge[6]) * radius2 },
	{ x: Math.cos(islandAnglesLarge[7]) * (radius2 + 8), y: 0, z: Math.sin(islandAnglesLarge[7]) * (radius2 + 8) },
	{ x: Math.cos(islandAnglesLarge[8]) * (radius2 + 8), y: 0, z: Math.sin(islandAnglesLarge[8]) * (radius2 + 8) },
	{ x: Math.cos(islandAnglesLarge[9]) * (radius2 + 8), y: 0, z: Math.sin(islandAnglesLarge[9]) * (radius2 + 8) },
	{ x: Math.cos(islandAnglesLarge[10]) * (radius2 + 8), y: 0, z: Math.sin(islandAnglesLarge[10]) * (radius2 + 8) },
	{ x: Math.cos(islandAnglesLarge[11]) * (radius2 + 8), y: 0, z: Math.sin(islandAnglesLarge[11]) * (radius2 + 8) },
]

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const clock = new THREE.Clock()

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

	// Create center container group for islands at (0,0,0)
	islandOrbitGroup = new THREE.Group()
	islandOrbitGroup.position.set(0, 0, 0)
	scene.add(islandOrbitGroup)

	addIslands()
	raycast()
	setupScrollNavigation()
	animate()
}

async function addIslands() {
	const userIslands = window.userIslands || []

	if (userIslands.length === 0) {
		console.warn('No islands found for user')
		return
	}

	let islandCount = userIslands.length
	islandGroups = [] // Clear and reset island groups array
	islandCurrentPositionIndices = [] // Reset position indices
	islandCircleType = [] // Reset circle types

	// Order: Add 4 to inner, 3 to outer, 1 to inner, 1 to outer, fill inner, fill outer
	const FIRST_INNER_BATCH = 4
	const FIRST_OUTER_BATCH = 3
	const SECOND_INNER_BATCH = 5  // 4 + 1
	const SECOND_OUTER_BATCH = 4  // 3 + 1
	const MAX_INNER = islandPositionsSmall.length // 8
	const MAX_OUTER = islandPositionsLarge.length // 12


	let userIndex = 0
	let innerCount = 0
	let outerCount = 0

	// Phase 1: Add first 4 to inner circle
	while (userIndex < islandCount && innerCount < FIRST_INNER_BATCH && innerCount < MAX_INNER) {
		smallRadiusUserAddedCount += 1
		const x = islandPositionsSmall[innerCount].x
		const y = islandPositionsSmall[innerCount].y
		const z = islandPositionsSmall[innerCount].z
		const islandGroup = addIsland(userIslands[userIndex].name, islandOrbitGroup, new THREE.Vector3(x, y, z), new THREE.Vector3(1, 1, 1), loadingManager, meshes, userIslands[userIndex].color, userIslands[userIndex].model)
		islandGroup.userData.islandData = userIslands[userIndex] // Store island data for memory display
		islandGroups.push(islandGroup)
		islandCurrentPositionIndices.push(innerCount)
		islandCircleType.push('small')
		innerCount++
		userIndex++
	}

	// Phase 2: Add 3 to outer circle
	while (userIndex < islandCount && outerCount < FIRST_OUTER_BATCH && outerCount < MAX_OUTER) {
		largeRadiusUserAddedCount += 1
		const x = islandPositionsLarge[outerCount].x
		const y = islandPositionsLarge[outerCount].y
		const z = islandPositionsLarge[outerCount].z
		const islandGroup = addIsland(userIslands[userIndex].name, islandOrbitGroup, new THREE.Vector3(x, y, z), new THREE.Vector3(1, 1, 1), loadingManager, meshes, userIslands[userIndex].color, userIslands[userIndex].model)
		islandGroup.userData.islandData = userIslands[userIndex] // Store island data for memory display
		islandGroups.push(islandGroup)
		islandCurrentPositionIndices.push(outerCount)
		islandCircleType.push('large')
		outerCount++
		userIndex++
	}

	// Phase 3: Add 1 more to inner circle (total 5)
	while (userIndex < islandCount && innerCount < SECOND_INNER_BATCH && innerCount < MAX_INNER) {
		smallRadiusUserAddedCount += 1
		const x = islandPositionsSmall[innerCount].x
		const y = islandPositionsSmall[innerCount].y
		const z = islandPositionsSmall[innerCount].z
		const islandGroup = addIsland(userIslands[userIndex].name, islandOrbitGroup, new THREE.Vector3(x, y, z), new THREE.Vector3(1, 1, 1), loadingManager, meshes, userIslands[userIndex].color, userIslands[userIndex].model)
		islandGroup.userData.islandData = userIslands[userIndex] // Store island data for memory display
		islandGroups.push(islandGroup)
		islandCurrentPositionIndices.push(innerCount)
		islandCircleType.push('small')
		innerCount++
		userIndex++
	}

	// Phase 4: Add 1 more to outer circle (total 4)
	while (userIndex < islandCount && outerCount < SECOND_OUTER_BATCH && outerCount < MAX_OUTER) {
		largeRadiusUserAddedCount += 1
		const x = islandPositionsLarge[outerCount].x
		const y = islandPositionsLarge[outerCount].y
		const z = islandPositionsLarge[outerCount].z
		const islandGroup = addIsland(userIslands[userIndex].name, islandOrbitGroup, new THREE.Vector3(x, y, z), new THREE.Vector3(1, 1, 1), loadingManager, meshes, userIslands[userIndex].color, userIslands[userIndex].model)
		islandGroup.userData.islandData = userIslands[userIndex] // Store island data for memory display
		islandGroups.push(islandGroup)
		islandCurrentPositionIndices.push(outerCount)
		islandCircleType.push('large')
		outerCount++
		userIndex++
	}

	// Phase 5: Fill remaining inner circle (positions 5-7)
	while (userIndex < islandCount && innerCount < MAX_INNER) {
		smallRadiusUserAddedCount += 1
		const x = islandPositionsSmall[innerCount].x
		const y = islandPositionsSmall[innerCount].y
		const z = islandPositionsSmall[innerCount].z
		const islandGroup = addIsland(userIslands[userIndex].name, islandOrbitGroup, new THREE.Vector3(x, y, z), new THREE.Vector3(1, 1, 1), loadingManager, meshes, userIslands[userIndex].color, userIslands[userIndex].model)
		islandGroup.userData.islandData = userIslands[userIndex] // Store island data for memory display
		islandGroups.push(islandGroup)
		islandCurrentPositionIndices.push(innerCount)
		islandCircleType.push('small')
		innerCount++
		userIndex++
	}

	// Phase 6: Fill remaining outer circle (positions 4-11)
	while (userIndex < islandCount && outerCount < MAX_OUTER) {
		largeRadiusUserAddedCount += 1
		const x = islandPositionsLarge[outerCount].x
		const y = islandPositionsLarge[outerCount].y
		const z = islandPositionsLarge[outerCount].z
		const islandGroup = addIsland(userIslands[userIndex].name, islandOrbitGroup, new THREE.Vector3(x, y, z), new THREE.Vector3(1, 1, 1), loadingManager, meshes, userIslands[userIndex].color, userIslands[userIndex].model)
		islandGroup.userData.islandData = userIslands[userIndex] // Store island data for memory display
		islandGroups.push(islandGroup)
		islandCurrentPositionIndices.push(outerCount)
		islandCircleType.push('large')
		outerCount++
		userIndex++
	}
}

let hitAdd = null
let isHoveringAdd = false
let hitIslandGroup = null
let isHoveringIsland = false

const ADD_ORIGINAL_Y_POSITION = 0.5
const ADD_HOVER_Y_POSITION = 0.3

// Island focus state
let islandFocusMode = false
let focusedIsland = null
const originalCameraPosition = { x: -24, y: 85, z: 100 }
const originalControlsTarget = { x: 9, y: 1, z: 0 }
const originalObjectPositions = new Map() // Store original positions for restoration
let displayedMemoryObjects = [] // Store memory objects for cleanup

function raycast() {
	window.addEventListener('click', () => {
		pointer.x = (event.clientX / window.innerWidth) * 2 - 1
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
		raycaster.setFromCamera(pointer, camera)

		const intersects = raycaster.intersectObjects(scene.children, true)

		if (intersects.length > 0) {
			let object = intersects[0].object
			while (object) {
				if (object.userData && object.userData.groupName === 'add') {
					window.location.href = '/add-island'
					break
				}

				if (object.userData && object.userData.groupName === 'landMain') {
					console.log('landMain', models.landMain)
					break
				}

				if (object.userData && object.userData.groupName === 'island') {
					if (!islandFocusMode) {
						focusOnIsland(object)
					}
					return
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
			// console.log('currentIslandGroup', currentIslandGroup)
			if (!isHoveringIsland || currentIslandGroup !== hitIslandGroup) {
				if (isHoveringIsland && hitIslandGroup && hitIslandGroup !== currentIslandGroup) {
					disableIslandGlow(hitIslandGroup)
				}
				hitIslandGroup = currentIslandGroup
				isHoveringIsland = true
				enableIslandGlow(currentIslandGroup)
			}
		} else if (!foundIsland && isHoveringIsland && hitIslandGroup) {
			isHoveringIsland = false
			disableIslandGlow(hitIslandGroup)
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
			// Disable glow when mouse leaves
			disableIslandGlow(hitIslandGroup)
			hitIslandGroup = null
		}
	})
}

function focusOnIsland(islandGroup) {
	islandFocusMode = true
	focusedIsland = islandGroup

	controls.enabled = false

	const islandWorldPosition = new THREE.Vector3()
	islandGroup.getWorldPosition(islandWorldPosition)

	const cameraOffset = new THREE.Vector3(-20, 50, 60)
	// const cameraOffset = new THREE.Vector3(-20, 500, 10)

	const targetCameraPosition = {
		x: islandWorldPosition.x + cameraOffset.x,
		y: islandWorldPosition.y + cameraOffset.y,
		z: islandWorldPosition.z + cameraOffset.z
	}

	originalObjectPositions.clear()

	islandGroups.forEach(island => {
		if (island !== islandGroup) {
			// Store original position
			originalObjectPositions.set(island, {
				x: island.position.x,
				y: island.position.y,
				z: island.position.z
			})

			const moveOffset = island.position.x <= 0 ? -100 : 100

			gsap.to(island.position, {
				x: island.position.x + moveOffset,
				duration: 0.5,
				ease: 'power2.inOut'
			})
		}
	})

	if (meshes.add) {
		originalObjectPositions.set(meshes.add, {
			x: meshes.add.position.x,
			y: meshes.add.position.y,
			z: meshes.add.position.z
		})

		const moveOffset = meshes.add.position.x <= 10 ? -100 : 100

		gsap.to(meshes.add.position, {
			x: meshes.add.position.x + moveOffset,
			duration: 0.5,
			ease: 'power2.inOut'
		})
	}

	// Move main land out of view
	if (meshes.landMain) {
		originalObjectPositions.set(meshes.landMain, {
			x: meshes.landMain.position.x,
			y: meshes.landMain.position.y,
			z: meshes.landMain.position.z
		})

		const moveOffset = meshes.landMain.position.x <= 10 ? -100 : 100

		gsap.to(meshes.landMain.position, {
			x: meshes.landMain.position.x + moveOffset,
			duration: 0.5,
			ease: 'power2.inOut'
		})
	}

	// Animate camera to focus on island
	gsap.to(camera.position, {
		x: targetCameraPosition.x,
		y: targetCameraPosition.y,
		z: targetCameraPosition.z,
		duration: 1,
		ease: 'power2.inOut'
	})

	gsap.to(controls.target, {
		x: islandWorldPosition.x,
		y: islandWorldPosition.y,
		z: islandWorldPosition.z,
		duration: 1,
		ease: 'power2.inOut',
		onUpdate: () => {
			controls.update()
		}
	})

	displayFocusedIslandMemories(focusedIsland)

	// Scale up the focused island slightly
	// gsap.to(focusedIsland.scale, {
	// 	x: 1.5,
	// 	y: 1.5,
	// 	z: 1.5,
	// 	duration: 1,
	// 	ease: 'power2.inOut'
	// })
}

async function displayFocusedIslandMemories(islandGroup) {
	// Clear any existing memory objects
	clearDisplayedMemories()

	// Get island data
	const islandData = islandGroup.userData.islandData
	if (!islandData || !islandData.memories || islandData.memories.length === 0) {
		console.log('No memories found for this island')
		return
	}

	// Get island world position
	const islandWorldPosition = new THREE.Vector3()
	islandGroup.getWorldPosition(islandWorldPosition)

	// Fetch memory data for each memory ID
	const memoryPromises = islandData.memories.map(memoryId =>
		fetch(`/api/memory/${memoryId}`)
			.then(res => res.json())
			.catch(err => {
				console.error(`Error fetching memory ${memoryId}:`, err)
				return null
			})
	)

	const memories = await Promise.all(memoryPromises)
	const validMemories = memories.filter(m => m !== null)

	if (validMemories.length === 0) {
		console.log('No valid memories found')
		return
	}

	// Create memory group to hold all memory objects
	const memoryGroup = new THREE.Group()
	memoryGroup.name = 'islandMemories'
	scene.add(memoryGroup)

	// Position memories in a line behind the island
	const memoryCount = validMemories.length
	const lineDistance = 5 // Distance behind island
	const lineLength = (memoryCount - 1) * 4 // Total length of the line (4 units spacing between memories)
	const startX = islandWorldPosition.x - lineLength / 2 // Start position of the line

	validMemories.forEach((memory, index) => {
		const x = startX + (index * 4)
		const z = islandWorldPosition.z - lineDistance
		const y = islandWorldPosition.y + 2

		const memoryObject = createMemoryObject(memory, new THREE.Vector3(x, y, z))
		if (memoryObject) {
			memoryGroup.add(memoryObject)
			displayedMemoryObjects.push(memoryObject)
		}
	})

	displayedMemoryObjects.push(memoryGroup) // Store group for cleanup

	// Animate memories in
	memoryGroup.children.forEach((child, index) => {
		child.position.y -= 5 // Start below
		child.scale.set(0, 0, 0)
		gsap.to(child.position, {
			y: child.position.y + 5,
			duration: 0.8,
			delay: index * 0.1,
			ease: 'power2.out'
		})
		gsap.to(child.scale, {
			x: 1,
			y: 1,
			z: 1,
			duration: 0.8,
			delay: index * 0.1,
			ease: 'back.out(1.7)'
		})
	})
}

function createMemoryObject(memory, position) {
	const memoryGroup = new THREE.Group()
	memoryGroup.position.copy(position)

	// Emotion color mapping
	const emotionColors = {
		'red': 0xED705C,
		'yellow': 0xF3D074,
		'green': 0xB9D580,
		'blue': 0x86BBE7,
		'purple': 0xB185D0
	}

	const emotionColor = emotionColors[memory.emotion] || 0xffffff

	// Create a plane for the memory
	const planeSize = 3
	const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize)
	createColoredMemoryPlane(memoryGroup, planeGeometry, emotionColor)

	const glowGeometry = new THREE.PlaneGeometry(planeSize * 1.2, planeSize * 1.2)
	const glowMaterial = new THREE.MeshBasicMaterial({
		color: emotionColor,
		transparent: true,
		opacity: 0.3,
		side: THREE.DoubleSide
	})
	const glow = new THREE.Mesh(glowGeometry, glowMaterial)
	glow.rotation.y = Math.PI
	glow.position.z = -0.01
	memoryGroup.add(glow)

	if (memory.title) {
		// Create a simple text representation using a sprite or geometry
		// For now, we'll just use the colored plane
	}

	return memoryGroup
}

function createColoredMemoryPlane(parent, geometry, color) {
	const material = new THREE.MeshStandardMaterial({
		color: color,
		side: THREE.DoubleSide,
		emissive: new THREE.Color(color),
		emissiveIntensity: 0.3
	})
	const plane = new THREE.Mesh(geometry, material)
	plane.rotation.y = Math.PI
	parent.add(plane)
} 

function clearDisplayedMemories() {
	displayedMemoryObjects.forEach(obj => {
		if (obj.parent) {
			obj.parent.remove(obj)
		}
		if (obj.geometry) obj.geometry.dispose()
		if (obj.material) {
			if (Array.isArray(obj.material)) {
				obj.material.forEach(mat => {
					if (mat.map) mat.map.dispose()
					mat.dispose()
				})
			} else {
				if (obj.material.map) obj.material.map.dispose()
				obj.material.dispose()
			}
		}
		obj.traverse(child => {
			if (child.geometry) child.geometry.dispose()
			if (child.material) {
				if (Array.isArray(child.material)) {
					child.material.forEach(mat => {
						if (mat.map) mat.map.dispose()
						mat.dispose()
					})
				} else {
					if (child.material.map) child.material.map.dispose()
					child.material.dispose()
				}
			}
		})
	})
	displayedMemoryObjects = []
}

function exitFocusMode() {
	if (!islandFocusMode) return

	islandFocusMode = false

	// Clear displayed memories
	clearDisplayedMemories()

	// Restore camera position
	gsap.to(camera.position, {
		x: originalCameraPosition.x,
		y: originalCameraPosition.y,
		z: originalCameraPosition.z,
		duration: 1,
		ease: 'power2.inOut'
	})

	gsap.to(controls.target, {
		x: originalControlsTarget.x,
		y: originalControlsTarget.y,
		z: originalControlsTarget.z,
		duration: 1,
		ease: 'power2.inOut',
		onUpdate: () => {
			controls.update()
		},
		onComplete: () => {
			controls.enabled = true
		}
	})

	// Restore all objects to their original positions
	originalObjectPositions.forEach((originalPos, object) => {
		gsap.to(object.position, {
			x: originalPos.x,
			y: originalPos.y,
			z: originalPos.z,
			duration: 0.5,
			ease: 'power2.inOut'
		})
	})

	focusedIsland = null
}

function setupScrollNavigation() {
	window.addEventListener('wheel', (event) => {
		// Only enable scroll if island count > 7 and not in focus mode
		if (islandGroups.length < 7 || isScrolling || islandFocusMode) return

		scrollDelta += event.deltaY

		if (Math.abs(scrollDelta) >= SCROLL_THRESHOLD) {
			const direction = scrollDelta > 0 ? 1 : -1
			scrollDelta = 0
			moveIslandsToPreviousPositions(direction > 0)
		}
	}, { passive: true })

	// Add ESC key to exit focus mode
	window.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && islandFocusMode) {
			exitFocusMode()
		}
	})
}

function moveIslandsToPreviousPositions(backwards = true) {
	if (islandGroups.length === 0) return

	isScrolling = true

	const newPositions = []
	let innerCount = smallRadiusUserAddedCount
	let outerCount = largeRadiusUserAddedCount

	// Define visible and offscreen position indices
	const VISIBLE_START = 0
	const VISIBLE_END = 3
	const OFFSCREEN_ENTRY = 4  // Islands enter from here
	const OFFSCREEN_EXIT = 7   // Islands exit from here

	for (let i = 0; i < islandGroups.length; i++) {
		const circleType = islandCircleType[i]
		const currentPosIndex = islandCurrentPositionIndices[i]
		const positionsArray = circleType === 'small' ? islandPositionsSmall : islandPositionsLarge
		const anglesArray = circleType === 'small' ? islandAnglesSmall : islandAnglesLarge
		const radiusValue = circleType === 'small' ? radius : radius2

		let targetIndex

		if (backwards) {
			if (circleType === 'small') {
				targetIndex = (currentPosIndex - 1 + innerCount) % innerCount
			} else {
				targetIndex = (currentPosIndex - 1 + outerCount) % outerCount
			}
		} else {
			if (circleType === 'small') {
				targetIndex = (currentPosIndex + 1 + innerCount) % innerCount
			} else {
				targetIndex = (currentPosIndex + 1 + outerCount) % outerCount
			}
		}

		// Determine if island needs to move offscreen (circular path)
		let needsCircularPath = false
		let waypoints = []

		if (circleType === 'small') {
			// Check if island is exiting visible area or entering visible area
			if (backwards) {
				// console.log('currentPosIndex', currentPosIndex, '= VISIBLE_START', VISIBLE_START)
				// console.log('targetIndex', targetIndex, '>=VISIBLE_END', VISIBLE_END)
				if (targetIndex >= VISIBLE_END && currentPosIndex == VISIBLE_START) {
					needsCircularPath = true
					// Path: current → 7 (exit) → 6 → 5 (entry) → target
					for (let idx = OFFSCREEN_EXIT; idx >= OFFSCREEN_ENTRY; idx--) {
						if (idx !== currentPosIndex) {
							waypoints.push({
								x: Math.cos(anglesArray[idx]) * radiusValue,
								y: 0,
								z: Math.sin(anglesArray[idx]) * radiusValue
							})
						}
					}
					// Add remaining path to target
					for (let idx = OFFSCREEN_ENTRY - 1; idx >= targetIndex; idx--) {
						waypoints.push({
							x: Math.cos(anglesArray[idx]) * radiusValue,
							y: 0,
							z: Math.sin(anglesArray[idx]) * radiusValue
						})
					}
				}
			} else {
				console.log('currentPosIndex', currentPosIndex, '= VISIBLE_END', VISIBLE_END, '\ntargetIndex', targetIndex, '<= VISIBLE_START', VISIBLE_START)

				if (targetIndex <= VISIBLE_START) {
					needsCircularPath = true
					console.log('needsCircularPath', needsCircularPath, currentPosIndex, targetIndex)
					// Path: current → 5 (entry/exit) → 6 → 7 (exit) → target
					for (let idx = OFFSCREEN_ENTRY; idx <= OFFSCREEN_EXIT; idx++) {
						if (idx !== currentPosIndex) {
							waypoints.push({
								x: Math.cos(anglesArray[idx]) * radiusValue,
								y: 0,
								z: Math.sin(anglesArray[idx]) * radiusValue
							})
						}
					}
					// Wrap around to beginning
					for (let idx = 0; idx <= targetIndex; idx++) {
						waypoints.push({
							x: Math.cos(anglesArray[idx]) * radiusValue,
							y: 0,
							z: Math.sin(anglesArray[idx]) * radiusValue
						})
					}
				}
			}
		} else if (circleType === 'large') {
			// Outer circle: visible positions 0-3, offscreen positions 4-11
			const LARGE_VISIBLE_END = 2
			const LARGE_OFFSCREEN_ENTRY = 3
			const LARGE_OFFSCREEN_EXIT = 11

			if (backwards) {
				// console.log('currentPosIndex', currentPosIndex, '= VISIBLE_START', VISIBLE_START, '\ntargetIndex', targetIndex, '>=LARGE_VISIBLE_END', LARGE_VISIBLE_END)
				if (targetIndex >= LARGE_VISIBLE_END && currentPosIndex == VISIBLE_START) {
					needsCircularPath = true
					// console.log('needsCircularPath', needsCircularPath)
					for (let idx = LARGE_OFFSCREEN_EXIT; idx >= LARGE_OFFSCREEN_ENTRY; idx--) {
						if (idx !== currentPosIndex) {
							const adjustedRadius = idx >= 9 ? radiusValue + 4 : radiusValue
							waypoints.push({
								x: Math.cos(anglesArray[idx]) * adjustedRadius,
								y: 0,
								z: Math.sin(anglesArray[idx]) * adjustedRadius
							})
						}
					}
					for (let idx = LARGE_OFFSCREEN_ENTRY - 1; idx >= targetIndex; idx--) {
						waypoints.push({
							x: Math.cos(anglesArray[idx]) * radiusValue,
							y: 0,
							z: Math.sin(anglesArray[idx]) * radiusValue
						})
					}
				}
			} else {
				// console.log('currentPosIndex', currentPosIndex, '= LARGE_VISIBLE_END', LARGE_VISIBLE_END, '\ntargetIndex', targetIndex, '<= VISIBLE_START', VISIBLE_START)
				if (targetIndex <= VISIBLE_START) {
					needsCircularPath = true
					// console.log('needsCircularPath', needsCircularPath)

					for (let idx = LARGE_OFFSCREEN_ENTRY; idx <= LARGE_OFFSCREEN_EXIT; idx++) {
						if (idx !== currentPosIndex) {
							const adjustedRadius = idx >= 9 ? radiusValue + 4 : radiusValue
							waypoints.push({
								x: Math.cos(anglesArray[idx]) * adjustedRadius,
								y: 0,
								z: Math.sin(anglesArray[idx]) * adjustedRadius
							})
						}
					}
					for (let idx = 0; idx <= targetIndex; idx++) {
						waypoints.push({
							x: Math.cos(anglesArray[idx]) * radiusValue,
							y: 0,
							z: Math.sin(anglesArray[idx]) * radiusValue
						})
					}
				}
			}
		}

		const targetPosition = positionsArray[targetIndex]
		newPositions.push({
			island: islandGroups[i],
			position: { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z },
			newPositionIndex: targetIndex,
			needsCircularPath: needsCircularPath,
			waypoints: waypoints
		})
	}

	let animationsComplete = 0
	const totalAnimations = newPositions.length

	newPositions.forEach(({ island, position, newPositionIndex, needsCircularPath, waypoints }, index) => {
		const targetX = position.x
		const targetY = position.y
		const targetZ = position.z

		if (needsCircularPath && waypoints.length > 0) {
			// Create timeline for circular path animation
			const timeline = gsap.timeline({
				onComplete: () => {
					island.position.set(targetX, targetY, targetZ)
					islandCurrentPositionIndices[index] = newPositionIndex
					animationsComplete++
					if (animationsComplete === totalAnimations) {
						isScrolling = false
					}
				}
			})

			// Add each waypoint to the timeline with variable speed
			waypoints.forEach((waypoint, wpIndex) => {
				let duration
				if (wpIndex === 0) {
					duration = 0.3
				}
				else if (wpIndex === waypoints.length - 1) {
					duration = 0.3
				}
				else {
					duration = 0.001
					// duration = 0.1
				}

				timeline.to(island.position, {
					x: waypoint.x,
					y: waypoint.y,
					z: waypoint.z,
					duration: duration,
					ease: 'power1.inOut'
				})
			})

			// Final position: normal speed
			timeline.to(island.position, {
				x: targetX,
				y: targetY,
				z: targetZ,
				duration: 0.3,
				ease: 'power1.inOut'
			})
		} else {
			// Direct animation for islands that don't need circular path
			gsap.to(island.position, {
				x: targetX,
				y: targetY,
				z: targetZ,
				duration: 0.6,
				ease: 'power2.inOut',
				onComplete: () => {
					island.position.set(targetX, targetY, targetZ)
					islandCurrentPositionIndices[index] = newPositionIndex
					animationsComplete++
					if (animationsComplete === totalAnimations) {
						isScrolling = false
					}
				}
			})
		}
	})
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