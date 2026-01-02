import type { Coords } from 'proton-pass-extension/types/inline';

import { createStyleParser, getOffsetLeft, getOffsetTop } from '@proton/pass/utils/dom/computed-styles';
import { isHTMLElement } from '@proton/pass/utils/dom/predicates';

export const debugPosition = (left: number, top: number, width: number, height: number) => {
    const div = document.createElement('div');
    div.classList.add('protonpass-debug');
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.background = 'red';
    div.style.zIndex = '2147483647';
    div.style.position = 'fixed';
    div.style.top = `${top}px`;
    div.style.left = `${left}px`;
    div.style.overflow = 'hidden';
    div.innerHTML = 'DEBUG';
    document.body.appendChild(div);
    setTimeout(() => document.body.removeChild(div), 1_000);
};

export const getNodePosition = (node: HTMLElement): Coords => {
    const { top, left } = node.getBoundingClientRect();
    const styles = createStyleParser(node);
    const offsetTop = getOffsetTop(styles);
    const offsetLeft = getOffsetLeft(styles);

    const coords = { top: top + offsetTop, left: left + offsetLeft };
    return coords;
};

export const SCROLL_OPTIONS = { capture: true, passive: true } as const;

/** Creates a scroll event handler that captures baseline scroll position when
 * created and triggers the callback only once when actual scroll movement is
 * detected. Use with `SCROLL_OPTIONS` since it doesn't include `once: true` */
export const onActualScroll = (target: HTMLElement | Window, fn: () => void) => {
    let didScroll = false;

    const getScrollLeft = () => (isHTMLElement(target) ? target.scrollLeft : target.scrollX);
    const getScrollTop = () => (isHTMLElement(target) ? target.scrollTop : target.scrollY);
    const baseX = getScrollLeft();
    const baseY = getScrollTop();

    return (_: Event) => {
        if (didScroll) return;
        if (getScrollLeft() !== baseX || getScrollTop() !== baseY) {
            didScroll = true;
            fn();
        }
    };
};
