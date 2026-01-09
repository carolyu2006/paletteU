window.onload = async () => {
    const shapes = document.querySelectorAll('.shape');
    const body = document.body;
    let activeShape = null;
    let gracePeriodTimeout = null;
    let mouseMoveHandler = null;
    let targetSection = null;
    let isClosing = false;

    // shapes.forEach(shape => {
    //     shape.addEventListener('mouseenter', () => {
    //         if (activeShape && activeShape !== shape) {
    //             closeShape(activeShape);
    //         }
    //         if (!activeShape) {
    //             openShape(shape);
    //         }
    //     });
    // });

    function openShape(shape) {
        // console.log('is closing: ', isClosing);
        activeShape = shape;
        const targetId = shape.getAttribute('data-target');

        shape.style.animationPlayState = 'paused';
        shape.classList.add('expanded');

        document.querySelectorAll('.content-section').forEach(el => {
            el.classList.remove('active', 'exiting');
        });
        void body.offsetHeight;
        targetSection = document.getElementById(targetId);
        if (targetSection && !isClosing) {
            // console.log('add active');
            targetSection.classList.add('active');
        }

        body.classList.add('has-active-section');

        if (gracePeriodTimeout) clearTimeout(gracePeriodTimeout);
        if (mouseMoveHandler) {
            window.removeEventListener('mousemove', mouseMoveHandler);
            mouseMoveHandler = null;
        }

        gracePeriodTimeout = setTimeout(() => {
            mouseMoveHandler = () => {
                // console.log('mousemove');
                isClosing = true;
                closeShape(shape);
                setTimeout(() => {
                    closeShape(shape);
                    isClosing = false;
                    // console.log("closed");
                }, 300);
            };
            window.addEventListener('mousemove', mouseMoveHandler, { passive: true });
        }, 500);
    }

    function closeShape(shape) {
        // console.log('closeShape');
        if (gracePeriodTimeout) {
            clearTimeout(gracePeriodTimeout);
            gracePeriodTimeout = null;
        }

        if (mouseMoveHandler) {
            window.removeEventListener('mousemove', mouseMoveHandler);
            mouseMoveHandler = null;
        }

        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            setTimeout(() => {
                // console.log('remove active');
                activeSection.classList.remove('active');
            }, 0);
            activeSection.classList.add('exiting');

            setTimeout(() => {
                // console.log('remove exiting');
                activeSection.classList.remove('exiting');
                void activeSection.offsetHeight;
            }, 500);


            setTimeout(() => {
                // console.log('remove expand');
                body.classList.remove('has-active-section');
                shape.classList.remove('expanded');
                shape.style.animationPlayState = 'running';
            }, 700);
        }

        if (activeShape === shape) {
            activeShape = null;
        }
    }
}
