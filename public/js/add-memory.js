const allImages = [];
let lastPreviewImageKey = null;

window.onload = async () => {
    const form = document.querySelector('form');
    if (form) {
        form.reset();
    }

    // Clear the accumulated images array
    allImages.length = 0;

    // Auto-select island from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const islandFromUrl = urlParams.get('island');
    if (islandFromUrl) {
        const islandCheckbox = document.getElementById(islandFromUrl);
        if (islandCheckbox) {
            islandCheckbox.checked = true;
            // Trigger change event to update preview
            islandCheckbox.dispatchEvent(new Event('change'));
        }
    }

    const imageInput = document.getElementById('image-input');
    displayImagePreviews();

    // Textarea auto-grow functionality
    const textarea = document.getElementById('description-input');
    if (textarea) {
        autoGrowTextarea();

        textarea.addEventListener('input', autoGrowTextarea);
        textarea.addEventListener('keydown', function (e) {
            setTimeout(autoGrowTextarea, 0);
        });
    }

    // Pre-select emotion from URL parameter or server-rendered value
    if (document.getElementById('memo-preview') && document.getElementById('memory-preview-circle')) {
        const urlParams = new URLSearchParams(window.location.search);
        const emotionFromUrl = urlParams.get('emotion');
        const emotionMap = {
            'anger': 'red',
            'joy': 'yellow',
            'disgust': 'green',
            'sadness': 'blue',
            'fear': 'purple'
        };
        const emotionValue = emotionMap[emotionFromUrl] || '';

        if (emotionValue) {
            const emotionRadio = document.getElementById(emotionValue);
            if (emotionRadio) {
                emotionRadio.checked = true;
            }
        }

        // Update preview on any form input change
        if (form) {
            // Use input event for text inputs
            form.addEventListener('input', function (e) {
                // Don't trigger on file inputs (they don't fire input events anyway)
                if (e.target.type !== 'file') {
                    updateMemoryPreview();
                }
            });

            // Use change event for radio buttons and file inputs
            form.addEventListener('change', function (e) {
                // For file inputs, only update image preview
                if (e.target.type === 'file') {
                    // Small delay to ensure file is ready
                    setTimeout(updateMemoryPreview, 10);
                } else {
                    updateMemoryPreview();
                }
            });

            // Also update when emotion is selected
            const emotionInputs = form.querySelectorAll('input[name="emotion"]');
            emotionInputs.forEach(input => {
                input.addEventListener('change', updateMemoryPreview);
            });
        }

        // Initial update
        updateMemoryPreview();
    }

    // Form validation and submission
    if (form) {
        // Check if update
        const emotionRadios = document.querySelectorAll('input[name="emotion"]');
        emotionRadios.forEach(radio => {
            radio.addEventListener('change', updateSubmitButton);
        });

        const dateInputs = ['date-year', 'date-month', 'date-day'];
        dateInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', updateSubmitButton);
            }
        });

        if (imageInput) {
            imageInput.addEventListener('change', updateSubmitButton);
            imageInput.addEventListener('change', displayImagePreviews);
        }

        if (textarea) {
            textarea.addEventListener('input', updateSubmitButton);
        }

        // Prevent form submission if validation fails
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!validateForm()) {
                return false;
            }

            // Create FormData from form fields
            const formData = new FormData(form);

            // Clear any existing image-input files
            formData.delete('image-input');

            // Add all accumulated images from allImages array
            allImages.forEach((file) => {
                formData.append('image-input', file);
            });

            // Submit via fetch instead of regular form submission
            fetch('/add-memory', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                body: formData
            })
                .then(async (response) => {
                    // If server returned JSON, use it; otherwise fallback to redirect
                    if (response.headers.get('content-type')?.includes('application/json')) {
                        const data = await response.json();
                        if (data && data.success) {
                            // Navigate back to the last page (or home as a fallback) once saved
                            const previous = document.referrer;
                            const fallback = '/home';
                            const cameFromAddMemory = previous && previous.includes('/add-memory');

                            // Prefer going back in history if it's not the add-memory page itself
                            if (window.history.length > 1 && !cameFromAddMemory) {
                                window.history.back();
                            } else if (previous && !cameFromAddMemory) {
                                window.location.href = previous;
                            } else {
                                window.location.href = fallback;
                            }
                        } else {
                            showInlineStatus('Error saving memory. Please try again.', 'error');
                        }
                        return;
                    }

                    // Fallback: if server responded with a redirect, follow it
                    if (response.redirected) {
                        window.location.href = response.url;
                    }
                })
                .catch(error => {
                    console.error('Error uploading:', error);
                    showInlineStatus('Upload failed. Please try again.', 'error');
                });
        });

        // Initial validation check
        updateSubmitButton();
    }
}

function updateMemoryPreview() {
    // Only run on add-memory page
    if (!document.getElementById('memo-preview')) {
        return;
    }
    if (!document.getElementById('memory-preview-circle')) {
        return;
    }
    const previewCircle = document.getElementById('memory-preview-circle');
    const preview = document.getElementById('memo-preview');
    const previewDate = document.getElementById('preview-date');
    const previewTitle = document.getElementById('preview-title');
    const previewDescription = document.getElementById('preview-description');
    const previewImageContainer = document.getElementById('preview-image-container');
    const previewIsland = document.getElementById('preview-island');
    // Get form values
    const year = document.getElementById('date-year')?.value || '';
    const month = document.getElementById('date-month')?.value || '';
    const day = document.getElementById('date-day')?.value || '';
    const title = document.getElementById('title-input')?.value || '';
    const description = document.getElementById('description-input')?.value || '';
    const emotion = document.querySelector('input[name="emotion"]:checked')?.value || '';

    const islands = document.querySelectorAll('input[name="island"]:checked');
    if (islands.length > 0) {
        let islandNames = Array.from(islands).map(island => island.value);
        islandNames = '#' + islandNames.join(', #');
        previewIsland.textContent = islandNames;
    } else {
        previewIsland.textContent = '';
    }

    // Update date
    if (year && month && day) {
        previewDate.textContent = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
    } else {
        previewDate.textContent = '';
    }

    // Update title
    previewTitle.textContent = title || '';

    // Update description
    previewDescription.textContent = description || '';

    // Update emotion background color
    preview.className = 'memo-item-preview';
    if (emotion) {
        preview.classList.remove('bg-red', 'bg-yellow', 'bg-green', 'bg-blue', 'bg-purple');
        previewCircle.classList.remove('bg-red', 'bg-yellow', 'bg-green', 'bg-blue', 'bg-purple');
        preview.classList.add(`bg-${emotion}`);
        previewCircle.classList.add(`bg-${emotion}`);
    } else {
        preview.classList.remove('bg-red', 'bg-yellow', 'bg-green', 'bg-blue', 'bg-purple');
        previewCircle.classList.remove('bg-red', 'bg-yellow', 'bg-green', 'bg-blue', 'bg-purple')
    }

  // Update image preview only if the first image changed; avoids flicker on every input change
  if (allImages && allImages.length > 0) {
    const file = allImages[0];
    const currentKey = file ? `${file.name}-${file.size}` : null;

    // If same image as last time, skip re-render to prevent flashing
    if (currentKey && currentKey === lastPreviewImageKey) {
      return;
    }

    lastPreviewImageKey = currentKey;

    if (file && file.type.startsWith('image/')) {
      // Check if we're already processing this file to avoid duplicates
      if (previewImageContainer.dataset.processingFile === file.name) {
        return; // Already processing this file
      }

      previewImageContainer.dataset.processingFile = file.name;
      const reader = new FileReader();
      reader.onload = function (e) {
        // Clear container again before adding (in case of race conditions)
        previewImageContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Preview';
        previewImageContainer.appendChild(img);
        // Clear the processing flag
        delete previewImageContainer.dataset.processingFile;
      };
      reader.onerror = function () {
        delete previewImageContainer.dataset.processingFile;
      };
      reader.readAsDataURL(file);
    }
  } else {
    // No images; clear preview and reset tracking key
    lastPreviewImageKey = null;
    previewImageContainer.innerHTML = '';
  }
}



function autoGrowTextarea() {
    const textarea = document.getElementById('description-input');
    if (!textarea) return;

    textarea.style.height = 'auto';

    const scrollHeight = textarea.scrollHeight;
    const minHeight = 20;
    const maxHeight = window.innerHeight * .14;

    let newHeight = Math.max(minHeight, scrollHeight);
    newHeight = Math.min(maxHeight, newHeight);

    textarea.style.height = newHeight + 'px';
}

function displayImagePreviews() {
    const imageInput = document.getElementById('image-input');
    const previewContainer = document.getElementById('image-preview-container');

    if (!imageInput || !previewContainer) return;

    const files = imageInput.files;
    Array.from(files).forEach((file) => {
        // Check if file is already in array by comparing name and size
        const isDuplicate = allImages.some(existingFile =>
            existingFile.name === file.name && existingFile.size === file.size
        );
        if (!isDuplicate) {
            allImages.push(file);
        }
    });

    imageInput.value = '';

    previewContainer.innerHTML = '';

    Array.from(allImages).forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.style.backgroundImage = `url(${e.target.result})`;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-image-btn';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', function (evt) {
                evt.preventDefault();
                removeImageFile(index);
            });

            previewItem.appendChild(removeBtn);
            previewContainer.appendChild(previewItem);
        };

        reader.readAsDataURL(file);
    });

    // Update memory preview when images change
    updateMemoryPreview();
}

function removeImageFile(indexToRemove) {
    // Remove the image from the allImages array
    allImages.splice(indexToRemove, 1);

    displayImagePreviews();

    // Update the submit button validation
    updateSubmitButton();
}

function validateForm() {
    const emotionRadios = document.querySelectorAll('input[name="emotion"]');
    const emotionSelected = Array.from(emotionRadios).some(radio => radio.checked);

    let dateValid = true;

    // Check if all date is filled
    const yearInput = document.getElementById('date-year');
    const monthInput = document.getElementById('date-month');
    const dayInput = document.getElementById('date-day');

    const dayValue = parseInt(dayInput.value.trim(), 10);
    const monthValue = parseInt(monthInput.value.trim(), 10);
    const yearValue = parseInt(yearInput.value.trim(), 10);

    const dayValid = !isNaN(dayValue) && dayValue >= 1 && dayValue <= 31;
    const monthValid = !isNaN(monthValue) && monthValue >= 1 && monthValue <= 12;
    const yearValid = !isNaN(yearValue) && yearValue >= 1900 && yearValue <= new Date().getFullYear();

    if (yearInput.value.trim().length > 0 || monthInput.value.trim().length > 0 || dayInput.value.trim().length > 0) {
        if (dayValid && monthValid && yearValid) {
            dateValid = true;
        } else {
            dateValid = false;
        }
    }

    // Check if either photo is uploaded or content is filled
    const titleInput = document.getElementById('title-input');
    const descriptionInput = document.getElementById('description-input');
    const imageInput = document.getElementById('image-input');

    // Check both allImages array and the file input
    const hasImageInArray = Array.isArray(allImages) && allImages.length > 0;
    const hasImageInInput = imageInput && imageInput.files && imageInput.files.length > 0;
    const hasImage = hasImageInArray || hasImageInInput;
    
    const hasContent = descriptionInput && descriptionInput.value.trim().length > 0;
    const hasTitle = titleInput && titleInput.value.trim().length > 0;
    console.log('dateValid', dateValid);
    console.log('emotionSelected', emotionSelected);
    console.log('hasImage', hasImage);
    // console.log('hasImageInArray', hasImageInArray);
    // console.log('hasImageInInput', hasImageInInput);
    // console.log('allImages.length', allImages ? allImages.length : 'allImages is null/undefined');
    console.log('allImages', allImages);
    console.log('hasContent', hasContent);
    console.log('hasTitle', hasTitle);

    return emotionSelected && dateValid && (hasImage || hasContent || hasTitle);
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


// Small inline status message helper
function showInlineStatus(message, type) {
    let statusEl = document.getElementById('add-memory-status');
    if (!statusEl) {
        statusEl = document.createElement('p');
        statusEl.id = 'add-memory-status';
        statusEl.style.marginTop = '8px';
        statusEl.style.fontSize = '12px';
        statusEl.style.letterSpacing = '0.5px';
        const form = document.querySelector('.add-memory-form');
        if (form) {
            form.parentNode.insertBefore(statusEl, form.nextSibling);
        }
    }
    statusEl.textContent = message;
    statusEl.style.color = type === 'success' ? 'var(--color-green, #4caf50)' : 'var(--color-red, #d9534f)';
}


