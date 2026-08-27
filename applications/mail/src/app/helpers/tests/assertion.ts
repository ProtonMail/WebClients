export const assertIcon = (
    iconElement: Element | null | undefined,
    iconName?: string,
    iconColor?: string,
    iconPrefix: string = 'ic'
) => {
    if (!iconElement) {
        throw new Error('Icon element is undefined');
    }

    if (iconName) {
        expect((iconElement.firstChild as Element).getAttribute('xlink:href')).toBe(`#${iconPrefix}-${iconName}`);
    }

    if (iconColor) {
        expect(iconElement.classList.contains(iconColor)).toBe(true);
    }
};

export const assertFocus = (element: Element | null | undefined, isFocused = true) => {
    const realIsFocused = document.activeElement === element;

    if (realIsFocused && !isFocused) {
        throw new Error('Element is focused while it should not');
    }
    if (!realIsFocused && isFocused) {
        throw new Error('Element is not focused while it should be');
    }
};

export const assertCheck = (item: HTMLElement, checked = true) => {
    const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(checkbox?.checked).toBe(checked);
};
