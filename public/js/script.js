let isTrainMemoryOpen = false;

function toggleMenu() {
    let menu = document.getElementById('dropdown-menu');

    // If menu doesn't exist, create it
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'dropdown-menu';
        menu.className = 'dropdown-menu';
        // menu.innerHTML = `
        // <div class="dropdown-menu-content">
        //     <div class="dropdown-menu-content-top">
        //         <button class="dropdown-menu-content-item">
        //             <img src="assets/icons/dropdown/profile.svg" alt="menu" class="menu">
        //             <p>Profile</p>
        //         </button>
        //         <button class="dropdown-menu-content-item">
        //             <img src="assets/icons/dropdown/upgrade.svg" alt="menu" class="menu">
        //             <p>Upgrade Plan</p>
        //             </button>
        //         <button class="dropdown-menu-content-item">
        //             <img src="assets/icons/dropdown/order.svg" alt="menu" class="menu">
        //             <p>Order</p>
        //         </button>
        //         <button class="dropdown-menu-content-item">
        //             <img src="assets/icons/dropdown/islands.svg" alt="menu" class="menu">
        //             <p>Islands</p>
        //         </button>
        //         <button class="dropdown-menu-content-item">
        //             <img src="assets/icons/dropdown/setting.svg" alt="menu" class="menu">
        //             <p>Setting</p>
        //         </button>
        //     </div>
        //     <div class="dropdown-menu-content-bottom">
        //         <button class="dropdown-menu-content-item">
        //             <img src="assets/icons/dropdown/help.svg" alt="menu" class="menu">
        //             <p>Help</p>
        //         </button>
        //         <button class="dropdown-menu-content-item" onclick="window.location.href='/explore'">
        //             <img src="assets/icons/dropdown/explore.svg" alt="menu" class="menu">
        //             <p>Explore More</p>
        //         </button>
        //         <button onclick="window.location.href='/logout'" class="dropdown-menu-content-item">
        //             <img src="assets/icons/dropdown/logout.svg" alt="menu" class="menu">
        //             <p>Logout</p>
        //         </button>
        //     </div>
        // </div>
        // `;
        
        menu.innerHTML = `
        <div class="dropdown-menu-content">
            <div class="dropdown-menu-content-top">
                <button class="dropdown-menu-content-item">
                    <img src="assets/icons/dropdown/islands.svg" alt="menu" class="menu">
                    <p>Islands</p>
                </button>
                <button class="dropdown-menu-content-item">
                    <img src="assets/icons/dropdown/setting.svg" alt="menu" class="menu">
                    <p>Setting</p>
                </button>
            </div>
            <div class="dropdown-menu-content-bottom">
                <button class="dropdown-menu-content-item">
                    <img src="assets/icons/dropdown/help.svg" alt="menu" class="menu">
                    <p>Help</p>
                </button>
                <button class="dropdown-menu-content-item" onclick="window.location.href='/explore'">
                    <img src="assets/icons/dropdown/explore.svg" alt="menu" class="menu">
                    <p>Explore More</p>
                </button>
                <button onclick="window.location.href='/logout'" class="dropdown-menu-content-item">
                    <img src="assets/icons/dropdown/logout.svg" alt="menu" class="menu">
                    <p>Logout</p>
                </button>
            </div>
        </div>
        `;
        document.body.appendChild(menu);

        // Close menu when clicking outside
        document.addEventListener('click', function (event) {
            if (!event.target.closest('.menu-button') && !event.target.closest('.dropdown-menu')) {
                menu.classList.remove('active');
            }
        });
    }

    // Toggle active class
    menu.classList.toggle('active');
}

function toggleTrain() {
    if (isTrainMemoryOpen) {
        return;
    }

    let trainButton = document.getElementById('train-button');
    
    if (trainButton && trainButton.classList.contains('train-button-locked')) {
        return;
    }

    let trainContainer = document.getElementById('train-container');
    let emotionsSection = document.getElementById('emotions-section');

    if (!trainContainer) {
        return;
    }

    if (!trainContainer.dataset.clickHandlerSet) {
        trainContainer.dataset.clickHandlerSet = 'true';

        document.addEventListener('click', function (event) {
            const clickedTrain = event.target.closest('#train-container');
            const clickedMenuButton = event.target.closest('.menu-button');
            const clickedMemoryDisplay = event.target.closest('#train-memory-display');
            const clickedCloseBtn = event.target.closest('.close-train-memory-btn');
            const clickedTrainCircle = event.target.closest('.train-circle');
            const trainMemoryContainer = document.getElementById('train-memory-container');

            if (clickedTrainCircle) {
                return;
            }

            if (isTrainMemoryOpen && trainMemoryContainer) {
                if (!clickedMemoryDisplay && !clickedCloseBtn) {
                    closeTrainMemory();
                    return; 
                }
                return;
            }

            if (!clickedMenuButton && !clickedTrain && trainContainer.classList.contains('active')) {
                trainContainer.classList.add('exiting');
                trainContainer.classList.remove('active');
                emotionsSection.classList.add('emotion-enter');
                emotionsSection.classList.remove('emotion-back-to-left');

                setTimeout(() => {
                    trainContainer.classList.add('back-to-left');
                    trainContainer.classList.remove('exiting');
                }, 2000);
            }
        });
    }

    if (trainContainer.classList.contains('active')) {
        trainContainer.classList.add('exiting');
        trainContainer.classList.remove('active');
        emotionsSection.classList.add('emotion-enter');
        emotionsSection.classList.remove('emotion-back-to-left');

        setTimeout(() => {
            trainContainer.classList.add('back-to-left');
            trainContainer.classList.remove('exiting');
        }, 2000);
    } else if (trainContainer.classList.contains('exiting')) {
        trainContainer.classList.remove('exiting');
        setTimeout(() => {
            requestAnimationFrame(() => {
                trainContainer.classList.add('active');
            });
        }, 50);
    } else {
        requestAnimationFrame(() => {
            trainContainer.classList.remove('back-to-left');
            trainContainer.classList.add('active');
            emotionsSection.classList.add('emotion-exit');
            emotionsSection.classList.remove('emotion-enter');

            setTimeout(() => {
                emotionsSection.classList.add('emotion-back-to-left');
                emotionsSection.classList.remove('emotion-exit');
            }, 2000);
        });
    }
}

function openMemory(button) {
    isTrainMemoryOpen = true;

    const memory = {
        _id: button.getAttribute('data-memory-id'),
        emotion: button.getAttribute('data-memory-emotion'),
        title: button.getAttribute('data-memory-title'),
        date: button.getAttribute('data-memory-date'),
        description: button.getAttribute('data-memory-description'),
        imgSrc: button.getAttribute('data-memory-imgsrc') ? [button.getAttribute('data-memory-imgsrc')] : [],
        island: button.getAttribute('data-memory-island') ? button.getAttribute('data-memory-island').split(',') : []
    };
    
    const trainMemoryContainer = document.getElementById('train-memory-container');
    const trainMemoryDisplay = document.getElementById('train-memory-display');
    const trainMemoryContent = document.getElementById('train-memory-content');
    
    if (!trainMemoryContainer || !trainMemoryDisplay || !trainMemoryContent) {
        console.error('Train memory elements not found');
        return;
    }
    
    let html = '';
    
    html = `
        <div class="memo-item bg-${memory.emotion}">
            ${memory.imgSrc && memory.imgSrc.length > 0 && memory.imgSrc[0] ? 
                `<img src="${memory.imgSrc[0]}" alt="image" class="memo-image">` : ''}
            ${memory.date ? `<p class="memo-date">${memory.date}</p>` : ''}
            ${memory.title ? `<p class="memo-title">${memory.title}</p>` : ''}
            ${memory.description ? `<p class="memo-description">${memory.description}</p>` : ''}
        </div>
    `;
    
    trainMemoryContent.innerHTML = html;
    trainMemoryContainer.style.display = 'flex';
}

function closeTrainMemory() {
    const trainMemoryContainer = document.getElementById('train-memory-container');
    if (trainMemoryContainer) {
        trainMemoryContainer.style.display = 'none';
    }
    setTimeout(() => {
        isTrainMemoryOpen = false;
    }, 200);
}

window.openMemory = openMemory;
window.closeTrainMemory = closeTrainMemory;


// Scroll detection

let scrollingTimeout;

window.addEventListener("scroll", () => {
  document.querySelector("body").classList.add("scrolling");

  clearTimeout(scrollingTimeout);
  scrollingTimeout = setTimeout(() => {
    document.querySelector("body").classList.remove("scrolling");
  }, 200);
});
