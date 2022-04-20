const keys: { [key: string]: number } = { ArrowLeft: 1, ArrowUp: 1, ArrowRight: 1, ArrowDown: 1 };

const preventDefault = (e: Event) => {
    e.preventDefault();
};

function preventDefaultForScrollKeys(e: KeyboardEvent) {
    if (keys[e.key]) {
        preventDefault(e);
        return false;
    }
}

const options = { passive: false, capture: true };

export const disableScroll = (target: HTMLElement) => {
    target.addEventListener('wheel', preventDefault, options);
    target.addEventListener('touchmove', preventDefault, options);
    target.addEventListener('keydown', preventDefaultForScrollKeys, options);
};

export const enableScroll = (target: HTMLElement) => {
    target.removeEventListener('wheel', preventDefault, options);
    target.removeEventListener('touchmove', preventDefault, options);
    target.removeEventListener('keydown', preventDefaultForScrollKeys, options);
};
