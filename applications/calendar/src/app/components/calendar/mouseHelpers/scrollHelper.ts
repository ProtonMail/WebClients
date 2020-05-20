const keys: { [key: number]: number } = { 37: 1, 38: 1, 39: 1, 40: 1 };

const preventDefault = (e: Event) => {
    e.preventDefault();
    e.returnValue = false;
};

function preventDefaultForScrollKeys(e: KeyboardEvent) {
    if (keys[e.keyCode]) {
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
