import * as THREE from 'three'
import Model from './model.js'
import { addText } from './addText.js'

const ISLAND_ORIGINAL_Y_POSITION = 0
const ISLAND_HOVER_Y_POSITION = -0.3

export const addIsland = (name, scene, position, scale, loadingManager, meshes, type, modelName) => {
    const islandGroup = new THREE.Group()
    islandGroup.position.copy(position)
    islandGroup.name = name
    islandGroup.userData['groupName'] = 'island'
    islandGroup.position.set(position.x, ISLAND_ORIGINAL_Y_POSITION, position.z)
    islandGroup.userData['originalY'] = ISLAND_ORIGINAL_Y_POSITION
    if (typeof window !== 'undefined') {
        window.lastIslandGroup = islandGroup
    }

    addIslandTop(islandGroup, islandGroup, position, scale, loadingManager, meshes, type)
    addIslandBase(islandGroup, islandGroup, position, scale, loadingManager, meshes)
    addText(islandGroup, name, new THREE.Vector3(position.x, position.y + 1, position.z + 2.6))
    addText(islandGroup, 'ISLAND', new THREE.Vector3(position.x, position.y + 1, position.z + 3.2))
    if (modelName && modelName !== 'My') {
        addIslandModel(islandGroup, islandGroup, position, scale, loadingManager, meshes, modelName)
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
    console.log('islandGroup', islandGroup)

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
            loadedMesh.traverse((child) => {
                if (child.isMesh) {
                    child.userData.groupName = 'islandModel';
                }
            })
        }
    })
    islandModel.init()
    return islandModel
}