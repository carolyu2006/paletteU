if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    if (window.addIslandInitialized) return;
    window.addIslandInitialized = true;

    initMemorySelector();
    initModelSelector();
    initColorSelector();
    initFormValidation();
}


function initMemorySelector() {
    const selectBtn = document.getElementById('select-memories-btn');
    const modal = document.getElementById('memory-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const confirmBtn = document.getElementById('confirm-memories-btn');
    const selectedDisplay = document.getElementById('selected-memories-display');
    const selectedInputs = document.getElementById('selected-memories-inputs');

    if (!selectBtn || !modal) return;

    function openModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function updateDisplay() {
        if (!selectedDisplay || !selectedInputs) return;

        const memoryIds = Array.from(selectedInputs.querySelectorAll('input[name="memories"]'))
            .map(input => input.value);

        selectedDisplay.innerHTML = '';

        memoryIds.forEach(memoryId => {
            const checkbox = document.querySelector(`.memory-modal-checkbox[data-memory-id="${memoryId}"]`);
            if (checkbox) {
                const emotion = checkbox.getAttribute('data-memory-emotion') || '';
                const square = document.createElement('div');
                square.className = `memory-color-square bg-${emotion}`;
                selectedDisplay.appendChild(square);
            }
        });
    }

    selectBtn.addEventListener('click', openModal);
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const selected = document.querySelectorAll('.memory-modal-checkbox:checked');
            selectedInputs.innerHTML = '';

            selected.forEach(checkbox => {
                const memoryId = checkbox.getAttribute('data-memory-id');
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'memories';
                input.value = memoryId;
                selectedInputs.appendChild(input);
            });

            updateDisplay();
            updateSubmitButton();
            closeModal();
        });
    }
}

function initModelSelector() {
    const selectBtn = document.getElementById('select-model-btn');
    const modal = document.getElementById('model-modal');
    const closeBtn = document.getElementById('close-model-modal-btn');
    const confirmBtn = document.getElementById('confirm-model-btn');
    const display = document.getElementById('selected-model-display');
    const input = document.getElementById('model-input');

    if (!selectBtn || !modal) return;

    let selectedModel = null;
    const models = getAvailableModels();

    function openModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function updateDisplay(model) {
        if (!display) return;

        display.innerHTML = '';

        if (model) {
            display.style.display = 'flex';
            const card = document.createElement('div');
            card.className = 'selected-model-card';

            const img = document.createElement('img');
            img.src = model.previewUrl;
            img.alt = model.displayName;
            img.className = 'selected-model-image';
            img.onerror = () => img.style.display = 'none';
            card.appendChild(img);
            display.appendChild(card);
        } else {
            display.style.display = 'none';
            input.style.display = 'none';
        }
    }

    const modelItems = document.querySelectorAll('.model-item');
    modelItems.forEach(item => {
        item.addEventListener('click', function() {
            modelItems.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            
            const modelName = this.getAttribute('data-model-name');
            selectedModel = models.find(m => m.name === modelName) || null;
        });
    });

    // Button handlers
    selectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (selectedModel) {
                if (input) {
                    input.value = selectedModel.name;
                    input.setAttribute('data-model-url', selectedModel.modelUrl || '');
                }
                updateDisplay(selectedModel);
                
                if (window.updateIslandPreview) {
                    window.updateIslandPreview();
                }
                
                updateSubmitButton();
                closeModal();
            }
        });
    }

    updateDisplay(null);
}

function getAvailableModels() {
    const items = document.querySelectorAll('.model-item');
    const models = [];

    items.forEach(item => {
        const name = item.getAttribute('data-model-name');
        if (name) {
            models.push({
                name: name,
                displayName: item.getAttribute('data-model-display-name') || name,
                modelUrl: item.getAttribute('data-model-url') || '',
                previewUrl: item.getAttribute('data-model-preview-url') || ''
            });
        }
    });

    return models;
}

function initColorSelector() {
    const buttons = document.querySelectorAll('.color-btn');
    const input = document.getElementById('color-input');

    if (!buttons.length || !input) return;

    buttons.forEach(button => {
        button.addEventListener('click', function() {
            buttons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            
            const color = this.getAttribute('data-color');
            input.value = color;
            
            if (window.updateIslandPreview) {
                window.updateIslandPreview();
            }
            
            // Update submit button when color changes
            updateSubmitButton();
        });
    });
}

function validateForm() {
    // Check if name is filled
    const nameInput = document.getElementById('name-input');
    const hasName = nameInput && nameInput.value.trim().length > 0;

    return hasName;
}

function updateSubmitButton() {
    const submitButton = document.querySelector('button.continue[type="submit"]');
    if (!submitButton) return;

    const isValid = validateForm();

    if (isValid) {
        submitButton.classList.add('valid');
        submitButton.disabled = false;
    } else {
        submitButton.classList.remove('valid');
        submitButton.disabled = true;
    }
}

function initFormValidation() {
    const form = document.querySelector('.add-island-form');
    if (!form) return;

    // Name input validation and uppercase conversion
    const nameInput = document.getElementById('name-input');
    if (nameInput) {
        // Convert to uppercase as user types
        nameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
            updateSubmitButton();
            // Update preview after uppercase conversion
            if (window.updateIslandPreview) {
                window.updateIslandPreview();
            }
        });
        
        // Ensure uppercase on form submission
        nameInput.addEventListener('blur', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Initial validation check
    updateSubmitButton();

    // Prevent form submission if validation fails
    form.addEventListener('submit', function(e) {
        // Ensure name is uppercase before submission
        if (nameInput) {
            nameInput.value = nameInput.value.toUpperCase();
        }
        
        if (!validateForm()) {
            e.preventDefault();
            return false;
        }
    });
}
