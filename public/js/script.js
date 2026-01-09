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
            <div class="dropdown-menu-content-normal">
                <button class="dropdown-menu-content-item" onclick="window.location.href='/all-islands'">
                    <img src="assets/icons/dropdown/islands.svg" alt="menu" class="menu">
                    <p>Islands</p>
                </button>
                <button class="dropdown-menu-content-item" onclick="window.location.href='/settings'">
                    <img src="assets/icons/dropdown/setting.svg" alt="menu" class="menu">
                    <p>Setting</p>
                </button>
                <button class="dropdown-menu-content-item" onclick="window.location.href='/feedback'">
                    <img src="assets/icons/dropdown/feedback.svg" alt="menu" class="menu">
                    <p>Feedback</p>
                </button>
                <button onclick="window.location.href='/logout'" class="dropdown-menu-content-item">
                    <img src="assets/icons/dropdown/logout.svg" alt="menu" class="menu">
                    <p>Logout</p>
                </button>
            </div>
        </div>
        `;
        document.body.appendChild(menu);

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

// Track main pages for smart navigation
const MAIN_PAGES = ['/island', '/home', '/all-memory', '/all-islands', '/'];
const PRIMARY_PAGES = ['/island', '/home', '/']; // Pages that are considered "home"
const SECONDARY_PAGES = ['/all-memory', '/all-islands', '/settings', '/feedback']; // Pages that should go back to primary

function trackMainPage() {
  const currentPath = window.location.pathname;
  if (MAIN_PAGES.includes(currentPath)) {
    sessionStorage.setItem('lastMainPage', currentPath);
  }
  
  // Track primary page separately
  if (PRIMARY_PAGES.includes(currentPath)) {
    sessionStorage.setItem('lastPrimaryPage', currentPath);
  }
}

// Track main page on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', trackMainPage);
} else {
  trackMainPage();
}

// Function to navigate back to primary page (for secondary pages)
function navigateToPrimaryPage() {
  let targetPage = sessionStorage.getItem('lastPrimaryPage');
  
  // Default to /home if no primary page is stored
  if (!targetPage || !PRIMARY_PAGES.includes(targetPage)) {
    targetPage = '/home';
  }
  
  window.location.href = targetPage;
}

window.navigateToPrimaryPage = navigateToPrimaryPage;

function navigateToLastMainPage() {
  let targetPage = null;
  
  // First, check if referrer is a main page (most recent)
  const referrer = document.referrer;
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      const currentUrl = new URL(window.location.href);
      
      // Only check if referrer is from the same origin
      if (referrerUrl.origin === currentUrl.origin) {
        const referrerPath = referrerUrl.pathname;
        
        // Check if the referrer path is a main page
        if (MAIN_PAGES.includes(referrerPath)) {
          targetPage = referrerPath;
        } else {
          // Check if referrer path starts with a main page (for query params)
          for (const mainPage of MAIN_PAGES) {
            if (mainPage !== '/' && referrerPath.startsWith(mainPage + '/')) {
              targetPage = mainPage;
              break;
            }
          }
        }
      }
    } catch (e) {
      // If URL parsing fails, fall through to sessionStorage
    }
  }
  
  // If referrer is not a main page, use sessionStorage
  if (!targetPage) {
    const lastMainPage = sessionStorage.getItem('lastMainPage');
    if (lastMainPage && MAIN_PAGES.includes(lastMainPage)) {
      targetPage = lastMainPage;
    }
  }
  
  // Default fallback
  if (!targetPage) {
    targetPage = '/all-memory';
  }
  
  // Use replaceState to avoid adding memory page to history
  window.history.replaceState(null, '', targetPage);
  window.location.href = targetPage;
}

window.navigateToLastMainPage = navigateToLastMainPage;

// Smart back navigation function for header back button
function navigateBack() {
  const currentPath = window.location.pathname;
  
  // If we're on a secondary page or a sub-route of a secondary page, go back to primary page
  const isSecondaryPage = SECONDARY_PAGES.some(page => 
    currentPath === page || currentPath.startsWith(page + '/')
  );
  
  if (isSecondaryPage) {
    navigateToPrimaryPage();
    return;
  }
  
  // If we're on a memory page, go back to all-memory (but don't record in history)
  if (currentPath.startsWith('/memory-')) {
    window.history.replaceState(null, '', '/all-memory');
    window.location.href = '/all-memory';
    return;
  }
  
  // For other pages, use default browser back
  window.history.back();
}

window.navigateBack = navigateBack;

// Scroll detection

let scrollingTimeout;

window.addEventListener("scroll", () => {
  document.querySelector("body").classList.add("scrolling");

  clearTimeout(scrollingTimeout);
  scrollingTimeout = setTimeout(() => {
    document.querySelector("body").classList.remove("scrolling");
  }, 200);
});
