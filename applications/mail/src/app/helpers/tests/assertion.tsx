import { render } from '@testing-library/react';

import type { IconComponent } from '@proton/icons/component';

/** For the sprite-based `Icon` and `MimeIcon`, which reference their symbol by name. */
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

/**
 * For the generated `Ic*` components. They inline their markup rather than referencing the sprite, so there is no
 * name to read back: the expected icon is rendered and its markup compared instead, which stays exact without the
 * test hardcoding any path data.
 */
export const assertIconComponent = (
    iconElement: Element | null | undefined,
    Icon: IconComponent,
    iconColor?: string
) => {
    if (!iconElement) {
        throw new Error('Icon element is undefined');
    }

    // A detached container keeps the reference icon out of the document the calling test queries.
    const { container } = render(<Icon />, { container: document.createElement('div') });
    expect(iconElement.innerHTML).toBe(container.querySelector('svg')?.innerHTML);

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
