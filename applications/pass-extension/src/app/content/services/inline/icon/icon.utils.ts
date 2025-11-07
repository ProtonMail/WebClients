import {
    ICON_MAX_HEIGHT,
    ICON_MIN_HEIGHT,
    ICON_PADDING,
    INPUT_BASE_STYLES_ATTR,
} from 'proton-pass-extension/app/content/constants.static';
import type { ProtonPassControl } from 'proton-pass-extension/app/content/services/inline/custom-elements/ProtonPassControl';
import ProtonPassControlStyles from 'proton-pass-extension/app/content/services/inline/custom-elements/ProtonPassControl.raw.scss';
import type { Coords } from 'proton-pass-extension/types/inline';

import type { MaybeNull } from '@proton/pass/types';
import {
    createStyleParser,
    getComputedHeight,
    pixelEncoder,
    pixelParser,
} from '@proton/pass/utils/dom/computed-styles';
import { createCustomElement, createElement } from '@proton/pass/utils/dom/create-element';
import { isHTMLElement, isInputElement } from '@proton/pass/utils/dom/predicates';
import { repaint } from '@proton/pass/utils/dom/repaint';
import { getNthParent } from '@proton/pass/utils/dom/tree';

type IconElement = {
    /** Button element injected into shadow DOM */
    icon: HTMLButtonElement;
    /** Control custom element */
    control: ProtonPassControl;
};

export type IconElementRefs = IconElement & {
    parent: HTMLElement | ShadowRoot;
    input: HTMLInputElement;
    anchor: HTMLElement;
};

export type IconStyles = {
    input: { paddingRight: number };
    icon: {
        top: number;
        right: number;
        size: number;
        fontSize: number;
        overlay: Coords & {
            radius: number;
            dx: number;
            gap: number;
        };
    };
};

type FieldOverrides = { ['padding-right']?: string };

const FLICKER_TRESHOLD = 2;
const OVERLAY_OFFSET = 1;
const MAX_OVERLAY_CHECKS = 2;
/** Calculates the maximum horizontal shift required for injected elements.
 * Determines the optimal positioning to avoid overlap with existing elements */
export const computeIconShift = (
    options: {
        /** X coordinate of the icon's intended center position */
        x: number;
        /** Y coordinate of the icon's intended center position */
        y: number;
        /** Radius of the circular icon (half of icon size) */
        radius: number;
        /** Maximum width of the input field - limits shift to 50% of this value */
        maxWidth: number;
        /** Bounding container element (form field wrapper or input itself) */
        anchor: HTMLElement;
        /** The input element we're positioning relative to */
        target: HTMLElement;
        /** Container for filtering (optional) */
        parent?: HTMLElement | ShadowRoot;
    },
    iteration: number = 1
): number => {
    const restore: { el: HTMLElement; pointerEvents: string }[] = [];

    try {
        const { x, y, maxWidth, target, anchor, parent } = options;
        const maxShift = options.maxWidth * 0.5; /* Maximum allowed shift */

        if (Number.isNaN(x) || Number.isNaN(y)) return 0;

        /** Prepass: `document.elementsFromPoint` will exclude elements that are
         * set to `pointer-events: none`. These may be part of the shift we want
         * to resolve. Set them to `auto` temporarily and restore */
        getNthParent(anchor, isInputElement(anchor) ? 2 : 0)
            .querySelectorAll('*')
            .forEach((el) => {
                if (isHTMLElement(el)) {
                    if (window.getComputedStyle(el).pointerEvents === 'none') {
                        const pointerEvents = el.style.pointerEvents;
                        el.style.pointerEvents = 'auto';
                        restore.push({ el, pointerEvents });
                    }
                }
            });

        /** Ideally we could also recursively get all shadowRoot elements at point if
         * `https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/elementsFromPoint`
         * becomes standard. Right now, some browsers return only the shadow root elements
         * present at that location. Other browsers include elements outside of the shadow DOM,
         * from the shadow DOM element in the topmost layer to the document root node. */
        const overlays = document.elementsFromPoint(x + OVERLAY_OFFSET, y + OVERLAY_OFFSET);
        let maxDx: number = 0;

        const skip = new Set();

        for (const el of overlays) {
            if (skip.has(el)) continue;
            if (el.classList.contains('protonpass-debug')) continue;
            if (el === target || el === anchor) break; /* Stop at target elements */
            if (!isHTMLElement(el)) continue; /* Skip non-HTMLElements */
            if (el.tagName.startsWith('PROTONPASS')) continue; /* Skip injected pass elements */
            if (parent && !parent.contains(el)) continue; /* Skip elements outside parent element (form) */
            if (el.matches('svg *')) continue; /* Skip SVG subtrees */

            /** Skip large text elements. NOTE: The `isHTMLElement` check is loose in order to
             * avoid heavy `instanceof` checks. In most cases it will correctly match an `HTMLElement`
             * but can end-up flagging elements which lack `innerText` or `offsetWidth` properties */
            if ((el.innerText?.length ?? 0) > 0 && (el.offsetWidth ?? 0) >= maxWidth * 0.8) continue;

            /** Skip hidden elements - if we match an invisible element:
             * heuristically skip all single-child containers wrapping it */
            const { display, visibility, opacity } = getComputedStyle(el);
            if (display === 'none' || visibility === 'hidden' || opacity === '0') {
                let parent = el.parentElement;
                while (parent && parent.childElementCount <= 1) {
                    skip.add(parent);
                    parent = parent.parentElement;
                }

                continue;
            }

            const { left } = el.getBoundingClientRect();
            const dx = Math.max(0, x + options.radius - left);
            if (dx > maxDx && dx < maxShift) maxDx = dx;
        }

        if (maxDx > 0 && iteration <= MAX_OVERLAY_CHECKS) {
            return maxDx + computeIconShift({ ...options, x: options.x - maxDx }, iteration++);
        }

        return maxDx;
    } catch (e) {
        return 0;
    } finally {
        restore.forEach(({ el, pointerEvents }) => (el.style.pointerEvents = pointerEvents));
    }
};

/** Avoids re-applying styles if we don't reach a repositioning
 * threshold which would create flickering issues */
export const hasIconInjectionStylesChanged = (a?: MaybeNull<IconStyles>, b?: MaybeNull<IconStyles>) => {
    if (!(a && b)) return true;
    if (Math.abs(a.icon.right - b.icon.right) > FLICKER_TRESHOLD) return true;
    if (Math.abs(a.icon.top - b.icon.top) > FLICKER_TRESHOLD) return true;
    return false;
};

export const getInputInitialStyles = (el: HTMLElement): FieldOverrides => {
    const initialStyles = el.getAttribute(INPUT_BASE_STYLES_ATTR);
    return initialStyles ? JSON.parse(initialStyles) : {};
};

export const cleanupInputStyles = (input: HTMLInputElement) => {
    Object.entries(getInputInitialStyles(input)).forEach(
        ([prop, value]) =>
            Boolean(value)
                ? input.style.setProperty(prop, value) /* if has initial style -> reset */
                : input.style.removeProperty(prop) /* else remove override */
    );

    input.removeAttribute(INPUT_BASE_STYLES_ATTR);
};

/* Force re-render/re-paint of the input element
 * before computing the icon injection styles in
 * order to avoid certain browser rendering optimisations
 * which cause incorrect DOMRect / styles to be resolved.
 * ie: check amazon sign-in page without repaint to
 * reproduce issue */
export const computeIconInjectionStyles = (options: Omit<IconElementRefs, 'icon'>): IconStyles => {
    const { anchor, input, control, parent } = options;
    const boxed = anchor !== input;

    cleanupInputStyles(input);

    repaint(input, control);
    if (boxed) repaint(anchor);

    const { right: inputRight, top: inputTop, height: inputHeight } = input.getBoundingClientRect();
    const { right: anchorRight, top: boxTop, height: boxMaxHeight } = anchor.getBoundingClientRect();
    const { top: controlTop, right: controlRight } = control.getBoundingClientRect();

    /** Get the rightmost edge between input and anchor elements.
     * This becomes our baseline for icon positioning calculations */
    const maxRight = Math.max(inputRight, anchorRight);

    const getInputStyle = createStyleParser(input);
    const getAnchorStyle = createStyleParser(anchor);

    /* If inputBox is not the input element in the case we
     * resolved a bounding element : compute inner height
     * without offsets in order to correctly position icon
     * if bounding element has some padding-top/border-top */
    const { value: boxHeight, offset: boxOffset } = getComputedHeight(getAnchorStyle, boxed ? 'inner' : 'outer');

    const size = Math.max(Math.min(boxMaxHeight - ICON_PADDING, ICON_MAX_HEIGHT), ICON_MIN_HEIGHT);
    const radius = size / 2;

    /** Extract existing padding-right to preserve visual spacing in layout.
     * This helps maintain the field's original visual appearance when injecting */
    const inputPr = getInputStyle('padding-right', pixelParser);
    const inputPl = getInputStyle('padding-left', pixelParser);
    const anchorPr = boxed ? getAnchorStyle('padding-right', pixelParser) : 0;
    const anchorPl = boxed ? getAnchorStyle('padding-left', pixelParser) : 0;
    const fieldPr = inputPr === 0 ? anchorPr : inputPr;
    const fieldPl = inputPl === 0 ? anchorPl : inputPl;

    /** Icon gap tries to scale harmoniously with field's tightest constraint.
     * Using min(left, right) prevents oversized gaps when one side has much larger padding */
    const iconGap = Math.max(8, size / 5);
    const iconGapLeft = iconGap;
    const iconGapRight = Math.max(Math.min(fieldPl, fieldPr) / 1.5, iconGap);

    const overlayX = maxRight - (iconGapRight + radius);
    const overlayY = inputTop + inputHeight / 2;
    const maxWidth = anchor.offsetWidth;

    /* Look for any overlayed elements if we were to inject
     * the icon on the right hand-side of the input element */
    const overlayDx = computeIconShift({ x: overlayX, y: overlayY, maxWidth, radius, anchor, target: input, parent });

    /** Calculate icon position relative to control element.
     * Top: vertically center within the anchor box accounting for offsets
     * Right: distance from control's right edge, including gaps and collision shifts */
    const top = boxTop - controlTop + boxOffset.top + (boxHeight - size) / 2;
    const right = controlRight - maxRight + iconGapRight + overlayDx;

    /** Calculate minimum padding-right needed to prevent icon from overlapping text.
     * If existing padding already provides enough space (considering collision shifts),
     * preserve it. Otherwise, extend padding to accommodate icon + gaps. */
    const newPaddingRight = (() => {
        const overlayMinRight = anchorRight - (overlayDx + iconGapRight + size + iconGapLeft);
        const inputMinRight = inputRight - inputPr;
        return overlayMinRight >= inputMinRight ? inputPr : inputPr + (inputMinRight - overlayMinRight);
    })();

    return {
        input: { paddingRight: newPaddingRight },
        icon: {
            top,
            right,
            size,
            fontSize: size / 2.5,
            overlay: {
                left: overlayX + overlayDx,
                top: overlayY,
                gap: iconGap,
                radius,
                dx: overlayDx,
            },
        },
    };
};

export const applyIconInjectionStyles = ({ icon, input }: IconElementRefs, styles: IconStyles) => {
    /* Get the width of the input element before applying the injection styles */
    const widthBefore = input.getBoundingClientRect().width;

    icon.style.top = pixelEncoder(styles.icon.top);
    icon.style.right = pixelEncoder(styles.icon.right);
    icon.style.width = pixelEncoder(styles.icon.size);
    icon.style.height = pixelEncoder(styles.icon.size);
    icon.style.setProperty(`--control-lineheight`, pixelEncoder(styles.icon.size));
    icon.style.setProperty(`--control-fontsize`, pixelEncoder(styles.icon.fontSize));

    /* Store the original input styles to handle potential clean-up
     * on extension updates or code hot-reload. */
    input.setAttribute(INPUT_BASE_STYLES_ATTR, JSON.stringify({ 'padding-right': input.style.paddingRight }));

    input.style.setProperty('padding-right', pixelEncoder(styles.input.paddingRight), 'important');
    const widthAfter = input.getBoundingClientRect().width;

    /* If the input width has increased due to padding, remove the override
     * and set it back to its original value (This can hapen on `content-box
     * box-sized elements or certain flexbox edge-cases ) */
    if (widthAfter !== widthBefore) {
        input.style.removeProperty('padding-right');
        input.style.setProperty('padding-right', input.style.paddingRight);
    }
};

export type CreateIconConfig = {
    parent: HTMLElement | ShadowRoot;
    tag: string;
    zIndex: number;
};

export const createIcon = ({ parent, tag, zIndex }: CreateIconConfig): IconElement => {
    const control = createCustomElement<ProtonPassControl>({ type: tag, styles: ProtonPassControlStyles });
    const icon = createElement<HTMLButtonElement>({ type: 'button', classNames: [] });

    icon.tabIndex = -1;
    icon.style.zIndex = zIndex.toString();
    icon.setAttribute('type', 'button');

    control.shadowRoot.appendChild(icon);
    parent.appendChild(control.customElement);

    return { icon, control: control.customElement };
};
