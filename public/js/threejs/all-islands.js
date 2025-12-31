import * as THREE from 'three'
import { addIsland } from './addIsland.js'
import { manager } from './manager.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { addDefaultMeshes } from './addDefaultMeshes.js'

const islandPreviews = []
const meshes = {}

// Loading manager
const loadingManager = manager(() => {}, () => {})

// Initialize scene for a single island preview
function createIslandPreview(container, islandData) {
    if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn('Container has no dimensions')
        return null
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1E1E1E)

    // Camera - same settings as add-island-preview
    const camera = new THREE.PerspectiveCamera(34, container.clientWidth / container.clientHeight, 0.1, 1000)
    camera.position.set(-2, 7, 8)
    camera.lookAt(0, 0, 0)

    // Renderer - same as add-island-preview
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // Controls - same settings as add-island-preview (no zoom, no rotate)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = false
    controls.enableRotate = false
    controls.target.set(0, 0, 0)

    // Lighting - same as add-island-preview
    const lightWhite = new THREE.DirectionalLight(0xffffff, 2.5)
    lightWhite.position.set(1, 10, 5)
    scene.add(lightWhite)
    const lightYellow = new THREE.DirectionalLight(0xFFBCAF, 2)
    lightYellow.position.set(-10, 6, 0)
    scene.add(lightYellow)

    // Add default meshes
    // const defaultMeshes = addDefaultMeshes({ xPos: 0, yPos: -0.8, zPos: 0 })
    // scene.add(defaultMeshes)

    // Add island
    const position = new THREE.Vector3(0, 0, 0)
    const scale = new THREE.Vector3(1, 1, 1)
    const islandGroup = addIsland(
        islandData.name,
        scene,
        position,
        scale,
        loadingManager,
        meshes,
        islandData.color || '1',
        islandData.model || '',
        true
    )

    islandGroup.userData.islandData = islandData

    // Remove any text meshes from this island (we only want the 3D model here)
    islandGroup.traverse((obj) => {
        if (obj.isMesh && obj.geometry && obj.geometry.type === 'TextGeometry') {
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
        }
    })

    function animate() {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
    })
    resizeObserver.observe(container)

    return {
        scene,
        camera,
        renderer,
        controls,
        islandGroup,
        container,
        cleanup: () => {
            resizeObserver.disconnect()
            // Clean up Three.js resources
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
            scene.remove(defaultMeshes)
            renderer.dispose()
        }
    }
}

function openEditModal(islandData) {
    // Navigate to edit island page
    if (islandData && islandData._id) {
        window.location.href = `/edit-island/${islandData._id}`;
    }
}

// Initialize when DOM is ready
function init() {
    const container = document.getElementById('islands-canvas-container')
    if (!container) {
        console.error('Islands container not found')
        return
    }

    const islands = window.islandsData || []
    
    if (islands.length === 0) {
        return
    }

    // Create a preview for each island
    islands.forEach((island, index) => {
        // Create container div for each island
        const islandCard = document.createElement('div')
        islandCard.className = 'island-card-item'
        
        // Create canvas container
        const canvasContainer = document.createElement('div')
        canvasContainer.className = 'island-preview-canvas'
        islandCard.appendChild(canvasContainer)


        container.appendChild(islandCard)

        // Make entire card clickable
        islandCard.style.cursor = 'pointer'
        islandCard.addEventListener('click', () => {
            openEditModal(island)
        })

        // Create Three.js preview after a small delay to ensure layout is ready
        requestAnimationFrame(() => {
            const preview = createIslandPreview(canvasContainer, island)
            if (preview) {
                islandPreviews.push(preview)
            } else {
                // Retry if container wasn't ready
                setTimeout(() => {
                    const retryPreview = createIslandPreview(canvasContainer, island)
                    if (retryPreview) {
                        islandPreviews.push(retryPreview)
                    }
                }, 100)
            }
        })
    })
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    islandPreviews.forEach(preview => {
        if (preview.cleanup) {
            preview.cleanup()
        }
    })
})

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}


