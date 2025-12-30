import * as THREE from 'three'
import Model from './model.js'
import { addText } from './addText.js'

const ISLAND_ORIGINAL_Y_POSITION = 0

// Glow effect helper functions
export function enableIslandGlow(islandGroup) {
    if (!islandGroup) return
    
    islandGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material]
            materials.forEach((material) => {
                // Only apply glow to MeshStandardMaterial and MeshPhysicalMaterial
                if (material && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)) {
                    // Store original emissive if not already stored
                    if (!material.userData.originalEmissive) {
                        material.userData.originalEmissive = material.emissive 
                            ? material.emissive.clone() 
                            : new THREE.color(0xF9DBC6)
                        material.userData.originalEmissiveIntensity = material.emissiveIntensity || 0
                    }
                    // Set glowing emissive based on material color (use a lighter version)
                    const baseColor = material.color || new THREE.Color(0xffffff)
                    material.emissive.copy(baseColor)
                    // Use emissive intensity to control glow strength (0.3-0.6 works well)
                    material.emissiveIntensity = 0.3
                    material.needsUpdate = true
                }
            })
        }
    })
}

export function disableIslandGlow(islandGroup) {
    if (!islandGroup) return
    
    islandGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material]
            materials.forEach((material) => {
                if (material && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) && material.userData.originalEmissive) {
                    material.emissive.copy(material.userData.originalEmissive)
                    material.emissiveIntensity = material.userData.originalEmissiveIntensity || 0
                    material.needsUpdate = true
                }
            })
        }
    })
}

export const addIsland = (name, scene, position, scale, loadingManager, meshes, type, modelName, showText = true) => {
    const islandGroup = new THREE.Group()
    islandGroup.name = name
    islandGroup.userData['groupName'] = 'island'
    // Set island group position to the world coordinates from the position arrays
    islandGroup.position.set(position.x, ISLAND_ORIGINAL_Y_POSITION, position.z)
    islandGroup.userData['originalY'] = ISLAND_ORIGINAL_Y_POSITION
    if (typeof window !== 'undefined') {
        window.lastIslandGroup = islandGroup
    }

    // Pass relative position (0,0,0) since children are relative to island group
    const relativePos = new THREE.Vector3(0, 0, 0)
    addIslandTop(islandGroup, islandGroup, relativePos, scale, loadingManager, meshes, type)
    addIslandBase(islandGroup, islandGroup, relativePos, scale, loadingManager, meshes)
    // Text positions are relative to island group (0,0,0), not world coordinates
    if (showText) {
        addText(islandGroup, name, new THREE.Vector3(0, 1, 2.6))
        addText(islandGroup, 'ISLAND', new THREE.Vector3(0, 1, 3.2))
    }
    if (modelName && modelName !== 'My') {
        addIslandModel(islandGroup, islandGroup, relativePos, scale, loadingManager, meshes, modelName)
    }

    const box = new THREE.Box3().setFromObject(islandGroup)
    const size = new THREE.Vector3()
    box.getSize(size)
    const center = new THREE.Vector3()
    box.getCenter(center)

    const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(size.x, size.y, size.z),
        new THREE.MeshBasicMaterial({ visible: true, color: 0xff0000 })
    )
    hitbox.position.copy(center)
    hitbox.userData.name = 'islandGroup'
    islandGroup.add(hitbox)
    // console.log('islandGroup', islandGroup)

    // islandGroup.init()
    scene.add(islandGroup)
    return islandGroup
}

export const addIslandTop = (scene, parentGroup, position, scale, loadingManager, meshes, type) => {
    const texture = new THREE.TextureLoader(loadingManager).load('/threejs/mat/' + type + '.png');
    texture.flipY = false;
    let islandTop = null
    // const islandTop = null

    if (type < 6 && type > 0) {
        islandTop = new Model({
            name: 'islandTop',
            url: '/threejs/land.glb',
            scene: scene,
            meshes: meshes,
            map: texture,
            toneMapped: false,
            scale: new THREE.Vector3(scale.x, scale.y, scale.z),
            position: new THREE.Vector3(position.x, position.y + .3, position.z),
            manager: loadingManager,
            callback: (loadedMesh) => {
                parentGroup.add(loadedMesh)
                if (parentGroup.userData && parentGroup.userData.groupName) {
                    loadedMesh.userData.parentGroupName = parentGroup.userData.groupName
                }

                loadedMesh.traverse((child) => {
                    if (child.isMesh) {
                        child.userData.groupName = 'islandTop';
                        texture.colorSpace = THREE.SRGBColorSpace;

                        child.material.map = texture;
                        child.material.needsUpdate = true;
                        child.material.roughness = 1
                        child.material.metalness = 0
                        child.material.alpha = 1.4;

                        child.material.color.set(0xffffff);
                        // Initialize emissive for glow effect
                        if (!child.material.emissive) {
                            child.material.emissive = new THREE.color(0xF9DBC6);
                        }
                        child.material.emissiveIntensity = 0;
                        child.material.needsUpdate = true;

                        if (child.geometry) {
                            child.geometry.computeBoundingBox();
                            const center = new THREE.Vector3();
                            child.geometry.boundingBox.getCenter(center);
                            child.geometry.translate(-center.x, -center.y, -center.z);
                        }
                    }
                })
            }
        });
    } else {
        islandTop = new Model({
            name: 'islandTop',
            url: '/threejs/land.glb',
            scene: scene,
            meshes: meshes,
            map: texture,
            toneMapped: false,
            scale: new THREE.Vector3(scale.x, scale.y, scale.z),
            position: new THREE.Vector3(position.x, position.y + .3, position.z),
            manager: loadingManager,
            callback: (loadedMesh) => {
                parentGroup.add(loadedMesh)
                if (parentGroup.userData && parentGroup.userData.groupName) {
                    loadedMesh.userData.parentGroupName = parentGroup.userData.groupName
                }

                loadedMesh.traverse((child) => {
                    if (child.isMesh) {
                        child.userData.groupName = 'islandTop';
                        // texture.colorSpace = THREE.SRGBColorSpace;

                        child.material.map = texture;
                        child.material.needsUpdate = true;
                        child.material.roughness = 1
                        child.material.metalness = 0
                        child.material.alpha = 1;

                        child.material.color.set(0xffffff);
                        // Initialize emissive for glow effect
                        if (!child.material.emissive) {
                            child.material.emissive = new THREE.color(0xF9DBC6);
                        }
                        child.material.emissiveIntensity = 0;
                        child.material.needsUpdate = true;

                        if (child.geometry) {
                            child.geometry.computeBoundingBox();
                            const center = new THREE.Vector3();
                            child.geometry.boundingBox.getCenter(center);
                            child.geometry.translate(-center.x, -center.y, -center.z);
                        }
                    }
                })
            }
        });
    }

    islandTop.init()
    return islandTop
}

export const addIslandBase = (scene, parentGroup, position, scale, loadingManager, meshes) => {
    const islandBase = new Model({
        name: 'islandBase',
        url: '/threejs/islandBase.glb',
        scene: scene,
        meshes: meshes,
        scale: new THREE.Vector3(scale.x, scale.y, scale.z),
        position: new THREE.Vector3(position.x, position.y, position.z),
        manager: loadingManager,
        callback: (loadedMesh) => {
            parentGroup.add(loadedMesh)

            if (parentGroup.userData && parentGroup.userData.groupName) {
                loadedMesh.userData.parentGroupName = parentGroup.userData.groupName
            }

            loadedMesh.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    child.userData.groupName = 'islandBase';
                    // Initialize emissive for glow effect
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material]
                        materials.forEach((material) => {
                            if (material && material.isMeshStandardMaterial) {
                                if (!material.emissive) {
                                    material.emissive = new THREE.color(0xF9DBC6);
                                }
                                material.emissiveIntensity = 0;
                            }
                        })
                    }
                    child.geometry.computeBoundingBox()
                    const center = new THREE.Vector3()
                    child.geometry.boundingBox.getCenter(center)
                    child.geometry.translate(-center.x, -center.y, -center.z)
                }
            })
        }
    })

    islandBase.init()
    return islandBase
}

export const addIslandModel = (scene, parentGroup, position, scale, loadingManager, meshes, name) => {

    if (name === 'CAT') {
        return addIslandModelType(scene, parentGroup, new THREE.Vector3(position.x, position.y + 0.3, position.z), scale, loadingManager, meshes, "/threejs/modelLibrary/cat.glb")
    } else if (name === 'FAMILY') {
        return addIslandModelType(scene, parentGroup, new THREE.Vector3(position.x, position.y + 0.2, position.z), scale, loadingManager, meshes, "/threejs/modelLibrary/family.glb")
    } else if (name === "FRIENDSHIP") {
        return addIslandModelType(scene, parentGroup, new THREE.Vector3(position.x, position.y + 0.3, position.z), scale, loadingManager, meshes, "/threejs/modelLibrary/friendship.glb")
    } else if (name === "BOOK") {
        return addIslandModelType(scene, parentGroup, new THREE.Vector3(position.x, position.y + 0.2, position.z), scale, loadingManager, meshes, "/threejs/modelLibrary/book.glb")
    }
    if (name === "GUITAR") {
        return addIslandModelType(scene, parentGroup, new THREE.Vector3(position.x, position.y + .33, position.z + .4), scale, loadingManager, meshes, "/threejs/modelLibrary/guitar.glb")
    }
    return null
}

function addIslandModelType(scene, parentGroup, position, scale, loadingManager, meshes, modelUrl) {
    const islandModel = new Model({
        name: 'islandModel',
        url: modelUrl,
        scene: scene,
        meshes: meshes,
        manager: loadingManager,
        scale: new THREE.Vector3(scale.x, scale.y, scale.z),
        position: new THREE.Vector3(position.x, position.y, position.z),
        callback: (loadedMesh) => {
            // Add directly to parentGroup - Model class will check if mesh has parent before adding to scene
            parentGroup.add(loadedMesh)
            if (parentGroup.userData && parentGroup.userData.groupName) {
                loadedMesh.userData.parentGroupName = parentGroup.userData.groupName
            }
            // Store original position for hover restoration
            loadedMesh.userData.originalPosition = new THREE.Vector3(position.x, position.y, position.z)
            loadedMesh.userData.originalY = position.y
            loadedMesh.traverse((child) => {
                if (child.isMesh) {
                    child.userData.groupName = 'islandModel';
                    // Initialize emissive for glow effect
                    if (child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material]
                        materials.forEach((material) => {
                            if (material && material.isMeshStandardMaterial) {
                                if (!material.emissive) {
                                    material.emissive = new THREE.color(0xF9DBC6);
                                }
                                material.emissiveIntensity = 0;
                            }
                        })
                    }
                    // Store original position in child meshes as well
                    child.userData.originalPosition = new THREE.Vector3(position.x, position.y, position.z)
                    child.userData.originalY = position.y
                }
            })
        }
    })
    islandModel.init()
    return islandModel
}