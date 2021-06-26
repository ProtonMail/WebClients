const DEFAULT_DURATION = 600;

const easeOutQuad = (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1);

const createScrollIntoView = (target: Element, container: Element, indefinite?: boolean, offset = 0) => {
    let rafId: number;
    let start: number;
    const duration = DEFAULT_DURATION;

    const run = (timestamp: number) => {
        if (!start) {
            start = timestamp;
        }

        const time = timestamp - start;
        const percent = easeOutQuad(Math.min(time / duration, 1));

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
