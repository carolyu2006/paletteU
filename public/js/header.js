
let isHovering = false;
let isHoveringAdd = false;
let hideTimeout = null;

// Initialize island button hover functionality
function initIslandButtonHover() {
    const islandButtonWrapper = document.getElementById('island-button-wrapper');
    const islandButton = document.getElementById('island-button');
    const addIslandButton = document.getElementById('add-island-button');

    if (!islandButtonWrapper || !islandButton || !addIslandButton) {
        return;
    }

    // Function to update button visibility based on hover states
    function updateButtonVisibility() {
        if (isHovering || isHoveringAdd) {
            addIslandButton.style.display = 'block';
        } else {
            addIslandButton.style.display = 'none';
        }
    }

    // Function to clear any pending hide timeout
    function clearHideTimeout() {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    }

    // Show add button on hover over island button
    islandButtonWrapper.addEventListener('mouseenter', () => {
        clearHideTimeout();
        isHovering = true;
        updateButtonVisibility();
    });

    // Keep button visible when hovering over the add button itself
    addIslandButton.addEventListener('mouseenter', () => {
        clearHideTimeout();
        isHoveringAdd = true;
        updateButtonVisibility();
    });

    // Hide button when leaving the add button
    addIslandButton.addEventListener('mouseleave', () => {
        isHoveringAdd = false;
        // Only hide if we're also not hovering over the wrapper
        if (!isHovering) {
            updateButtonVisibility();
        }
    });

    // Hide add button when mouse leaves the wrapper
    islandButtonWrapper.addEventListener('mouseleave', () => {
        // Clear any existing timeout
        clearHideTimeout();
        // Set a delayed hide, but only if we're not hovering over the add button
        hideTimeout = setTimeout(() => {
            // Double-check that we're still not hovering (mouse might have entered add button)
            if (!isHoveringAdd) {
                isHovering = false;
                updateButtonVisibility();
            }
            hideTimeout = null;
        }, 500);
    });

    // Navigate to add-island page on click
    addIslandButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '/add-island';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIslandButtonHover);
} else {
    initIslandButtonHover();
}

