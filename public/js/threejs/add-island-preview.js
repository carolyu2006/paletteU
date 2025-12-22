import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { addIsland } from './addIsland.js'
import Model from './model.js'
import { manager } from './manager.js'

let scene, camera, renderer, controls
let islandGroup = null
let islandModel = null
let meshes = {}
let mixers = []
let loadingManager

export function initIslandPreview(containerId) {
    const container = document.getElementById(containerId)
    if (!container) {
        console.error('Preview container not found:', containerId)
        return null
    }

    if (container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn('Container has no dimensions, waiting for layout...')
        setTimeout(() => initIslandPreview(containerId), 100)
        return null
    }

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1E1E1E)

    // Camera
    camera = new THREE.PerspectiveCamera(34, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(-2, 7, 8)
    camera.lookAt(0, 0, 0)

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = false;
    controls.enableRotate = false;
    controls.target.set(0, 0, 0)

    // Lighting
    const lightWhite = new THREE.DirectionalLight(0xffffff, 2.5)
    lightWhite.position.set(1, 10, 5)
    scene.add(lightWhite)
    const lightYellow = new THREE.DirectionalLight(0xFFBCAF, 2)
    lightYellow.position.set(-10, 6, 0)
    scene.add(lightYellow)

    // Loading manager
    loadingManager = manager()

    updatePreview()

    function animate() {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
    }
    animate()

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
    })

    return {
        update: updatePreview,
    }
}

function updatePreview() {
    if (!scene) {
        console.warn('Scene not initialized, cannot update preview')
        return
    }
    if (islandGroup) {
        removeIsland()
    }

    const colorInput = document.getElementById('color-input')
    const modelInput = document.getElementById('model-input')
    const nameInput = document.getElementById('name-input')
    const selectedColor = colorInput?.value || '1'
    const selectedModelName = modelInput?.value || ''
    const selectedModelUrl = modelInput?.getAttribute('data-model-url') || ''

    const position = new THREE.Vector3(0, 0, 0)
    const scale = new THREE.Vector3(1, 1, 1)
    const islandName = nameInput?.value || 'MY'

    islandGroup = addIsland(islandName, scene, position, scale, loadingManager, meshes, selectedColor, selectedModelName)
}

function removeIsland() {
    if (!islandGroup) {
        return
    }

    islandGroup.traverse((obj) => {
        if (obj.isMesh) {
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
        }
    })
    scene.remove(islandGroup)
    islandGroup = null

    const textMeshes = []
    scene.traverse((obj) => {
        if (obj.isMesh && obj.geometry && obj.geometry.type === 'TextGeometry') {
            textMeshes.push(obj)
        }
    })
    textMeshes.forEach(mesh => {
        scene.remove(mesh)
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => mat.dispose())
            } else {
                mesh.material.dispose()
            }
        }
    })

    const islandModels = []
    scene.traverse((obj) => {
        if (obj.userData && obj.userData.groupName === 'islandModel' && obj.parent === scene) {
            islandModels.push(obj)
        }
    })
    islandModels.forEach(model => {
        scene.remove(model)
        model.traverse((child) => {
            if (child.isMesh) {
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
            }
        })
    })

    // Clean up meshes object - remove meshes that are in the scene
    Object.keys(meshes).forEach(key => {
        const mesh = meshes[key]
        if (mesh) {
            // Check if mesh is still in the scene
            if (mesh.parent === scene || (mesh.parent && mesh.parent.parent === scene)) {
                if (mesh.parent) {
                    mesh.parent.remove(mesh)
                } else {
                    scene.remove(mesh)
                }
                mesh.traverse((child) => {
                    if (child.isMesh) {
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
                    }
                })
            }
            delete meshes[key]
        }
    })
}