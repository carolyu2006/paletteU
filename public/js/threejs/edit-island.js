import { initIslandPreview } from './add-island-preview.js'

let islandPreview = null

function initIslandPreviewModule() {
    const previewContainer = document.getElementById('threejs-preview-container')
    if (previewContainer) {
        islandPreview = initIslandPreview('threejs-preview-container')
        window.updateIslandPreview = () => {
            if (islandPreview && typeof islandPreview.update === 'function') {
                islandPreview.update()
            }
        }
        const nameInput = document.getElementById('name-input')
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                // Use requestAnimationFrame to ensure this runs after uppercase conversion
                requestAnimationFrame(() => {
                    islandPreview.update()
                })
            })
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIslandPreviewModule)
} else {
    initIslandPreviewModule()
}

window.onload = async () => {
    if (!islandPreview) {
        await initIslandPreviewModule()
    }
}

