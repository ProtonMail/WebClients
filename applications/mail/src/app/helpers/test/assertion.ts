export const assertIcon = (iconElement: Element | null | undefined, iconName?: string, iconColor?: string) => {
    if (!iconElement) {
        throw new Error('Icon element is undefined');
    }

    if (iconName) {
        expect((iconElement.firstChild as Element).getAttribute('xlink:href')).toBe(`#shape-${iconName}`);
    }

    if (iconColor) {
        expect(iconElement.classList.contains(iconColor)).toBe(true);
    }
};
