const DEFAULT_DURATION = 600;

const easeOutQuad = (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);

const createScrollIntoView = (target: Element, container: Element, indefinite?: boolean, offset = 0) => {
    let rafId: number;
    let start: number;
    // Drop the animation when the user has asked for less motion, landing on the target
    // in one frame. The loop itself still runs, so `indefinite` keeps holding the target
    // in place while the page settles.
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DEFAULT_DURATION;

    const run = (timestamp: number) => {
        if (!start) {
            start = timestamp;
        }

        const time = timestamp - start;
        const percent = duration === 0 ? 1 : easeOutQuad(Math.min(time / duration, 1));

        const rectTarget = target.getBoundingClientRect();
        const rectContainer = container.getBoundingClientRect();
        const diff = rectTarget.top - rectContainer.top - offset;
        const scrollY = container.scrollTop + diff * percent;

        container.scrollTop = Math.round(scrollY);

        if (time < duration || indefinite) {
            rafId = requestAnimationFrame(run);
        }
    };
    rafId = requestAnimationFrame(run);

    return () => {
        cancelAnimationFrame(rafId);
    };
};

export default createScrollIntoView;
