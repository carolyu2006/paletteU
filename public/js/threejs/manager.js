import { LoadingManager } from 'three'

export function manager(onProgress, onLoad) {
	const loadingManager = new LoadingManager()

	loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
		let progress = 0
		if (itemsTotal > 0) {
			progress = (itemsLoaded / itemsTotal) * 100
		}
		// console.log(`Loading progress: ${itemsLoaded}/${itemsTotal} (${Math.round(progress)}%) - ${url}`)
		if (onProgress) {
			onProgress(progress, itemsLoaded, itemsTotal)
		}
	}

	loadingManager.onLoad = function () {
		// console.log('LoadingManager: All assets loaded successfully')
		if (onLoad) {
			onLoad()
		}
	}

	loadingManager.onError = function (url) {
		// console.error('Error loading asset:', url)

		if (onProgress) {

		}
	}
	loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
		console.log(`Loading started: ${url} (${itemsLoaded}/${itemsTotal})`)
	}

	return loadingManager
}
