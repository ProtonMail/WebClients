import {
    ICON_MAX_HEIGHT,
    ICON_MIN_HEIGHT,
    ICON_PADDING,
    INPUT_BASE_STYLES_ATTR,
} from 'proton-pass-extension/app/content/constants.static';
import type { ProtonPassControl } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassControl';
import ProtonPassControlStyles from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassControl.raw.scss';

import {
    type StyleParser,
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

type IconElementRefs = IconElement & {
    parent: HTMLElement | ShadowRoot;
    input: HTMLInputElement;
    anchor: HTMLElement;
};

type IconInjectionOptions = {
    getInputStyle: StyleParser;
    getAnchorStyle: StyleParser;
};

/* input styles we may override */
type InputInitialStyles = { ['padding-right']?: string };

/** Calculates the maximum horizontal shift required for injected elements.
 * Determines the optimal positioning to avoid overlap with existing elements */
const getOverlayShift = (options: {
    x: number;
    y: number;
    anchor: HTMLElement;
    input: HTMLElement;
    parent: HTMLElement | ShadowRoot;
}): number => {
    const restore: { el: HTMLElement; pointerEvents: string }[] = [];

    try {
        const { x, y, parent, input, anchor } = options;
        const maxWidth = anchor.offsetWidth;
        const maxShift = maxWidth * 0.5; /* Maximum allowed shift */

        if (Number.isNaN(x) || Number.isNaN(y)) return 0;

        /** Prepass: `document.elementsFromPoint` will exclude elements that are
         * set to `pointer-events: none`. These may be part of the shift we want
         * to resolve. Set them to `auto` temporarily and restore */
        getNthParent(anchor, isInputElement(anchor) ? 2 : 1)
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
        const overlays = document.elementsFromPoint(x, y);
        let maxDx: number = 0;

        const skip = new Set();

        for (const el of overlays) {
            if (skip.has(el)) continue;
            if (el.classList.contains('protonpass-debug')) continue;
            if (el === input || el === anchor) break; /* Stop at target elements */
            if (!isHTMLElement(el)) continue; /* Skip non-HTMLElements */
            if (el.tagName.startsWith('PROTONPASS')) continue; /* Skip injected pass elements */
            if (!parent.contains(el)) continue; /* Skip elements outside parent element (form) */
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
            const dx = Math.max(0, x - left);
            if (dx > maxDx && dx < maxShift) maxDx = dx;
        }

        return maxDx;
    } catch (e) {
        return 0;
    } finally {
        restore.forEach(({ el, pointerEvents }) => (el.style.pointerEvents = pointerEvents));
    }
};

/* Force re-render/re-paint of the input element
 * before computing the icon injection styles in
 * order to avoid certain browser rendering optimisations
 * which cause incorrect DOMRect / styles to be resolved.
 * ie: check amazon sign-in page without repaint to
 * reproduce issue */
const computeIconInjectionStyles = (
    { anchor, input, control, parent }: Omit<IconElementRefs, 'icon'>,
    { getInputStyle, getAnchorStyle: getBoxStyle }: IconInjectionOptions
) => {
    repaint(input, control);

    const { right: inputRight, top: inputTop, height: inputHeight } = input.getBoundingClientRect();
    const { right: anchorRight, top: boxTop, height: boxMaxHeight } = anchor.getBoundingClientRect();
    const { top: controlTop, right: controlRight } = control.getBoundingClientRect();

    const maxRight = inputRight > anchorRight ? anchorRight : inputRight;

    /* If inputBox is not the input element in the case we
     * resolved a bounding element : compute inner height
     * without offsets in order to correctly position icon
     * if bounding element has some padding-top/border-top */
    const boxed = anchor !== input;
    const { value: boxHeight, offset: boxOffset } = getComputedHeight(getBoxStyle, boxed ? 'inner' : 'outer');

    const size = Math.max(Math.min(boxMaxHeight - ICON_PADDING, ICON_MAX_HEIGHT), ICON_MIN_HEIGHT);
    const pl = getInputStyle('padding-left', pixelParser);
    const pr = getInputStyle('padding-right', pixelParser);

    const iconPaddingLeft = size / 5; /* dynamic "responsive" padding */
    const iconPaddingRight = Math.max(Math.min(pl, pr) / 1.5, iconPaddingLeft);

    /* look for any overlayed elements if we were to inject
     * the icon on the right hand-side of the input element
     * accounting for icon size and padding  */
    let overlayDx = getOverlayShift({
        x: maxRight - (iconPaddingRight + size / 2),
        y: inputTop + inputHeight / 2,
        anchor,
        input,
        parent,
    });

    overlayDx = overlayDx !== 0 ? overlayDx + iconPaddingLeft + size / 2 : 0;

    /* Compute the new input padding :
     * Take into account the input element's current padding as it
     * may already cover the necessary space to inject the icon without
     * the need to mutate the input's padding style. Account for potential
     * overlayed element offset */
    const newPaddingRight = Math.max(pr, size + iconPaddingLeft + iconPaddingRight + overlayDx);

    /* `mt` represents the vertical offset needed to align the
     * center of the injected icon with the top-most part of
     * the bounding box :
     * mt = boxTop - boxOffset.top - controlTop - size / 2
     * top = mt + boxHeight / 2 */

    const top = boxTop - controlTop + boxOffset.top + (boxHeight - size) / 2;
    const right = controlRight - maxRight + iconPaddingRight + overlayDx;

    return {
        input: {
            paddingRight: pixelEncoder(newPaddingRight),
        },
        icon: {
            top: pixelEncoder(top),
            right: pixelEncoder(right),
            size: pixelEncoder(size),
            fontSize: size / 2.5,
        },
    };
};

export const getInputInitialStyles = (el: HTMLElement): InputInitialStyles => {
    const initialStyles = el.getAttribute(INPUT_BASE_STYLES_ATTR);
    return initialStyles ? JSON.parse(initialStyles) : {};
};

export const cleanupInputInjectedStyles = (input: HTMLInputElement) => {
    Object.entries(getInputInitialStyles(input)).forEach(
        ([prop, value]) =>
            Boolean(value)
                ? input.style.setProperty(prop, value) /* if has initial style -> reset */
                : input.style.removeProperty(prop) /* else remove override */
    );

    input.removeAttribute(INPUT_BASE_STYLES_ATTR);
};

export const cleanupInjectionStyles = ({ control, input }: Pick<IconElementRefs, 'control' | 'input'>) => {
    control.style.removeProperty('float');
    control.style.removeProperty('max-width');
    control.style.removeProperty('margin-left');
    cleanupInputInjectedStyles(input);
};

const applyIconInjectionStyles = (refs: IconElementRefs, options: IconInjectionOptions) => {
    const { icon, input } = refs;
    const styles = computeIconInjectionStyles(refs, options);

    /* Handle a specific scenario where input has transitions or
     * animations set, which could affect width change detection
     * and repositioning triggers. To avoid unwanted side-effects
     * when applying the injection style, temporarily disable these
     * properties */
    const { transition, animation } = input.style;
    input.style.setProperty('transition', 'none');
    input.style.setProperty('animation', 'none');

    /* Get the width of the input element before applying the injection styles */
    const widthBefore = input.getBoundingClientRect().width;

    icon.style.top = styles.icon.top;
    icon.style.right = styles.icon.right;
    icon.style.width = styles.icon.size;
    icon.style.height = styles.icon.size;
    icon.style.setProperty(`--control-lineheight`, styles.icon.size);
    icon.style.setProperty(`--control-fontsize`, pixelEncoder(styles.icon.fontSize));

    /* Store the original input styles to handle potential clean-up
     * on extension updates or code hot-reload. */
    input.setAttribute(INPUT_BASE_STYLES_ATTR, JSON.stringify({ 'padding-right': input.style.paddingRight }));

    input.style.setProperty('padding-right', styles.input.paddingRight, 'important');
    const widthAfter = input.getBoundingClientRect().width;

    /* If the input width has increased due to padding, remove the override
     * and set it back to its original value (This can hapen on `content-box
     * box-sized elements or certain flexbox edge-cases ) */
    if (widthAfter !== widthBefore) {
        input.style.removeProperty('padding-right');
        input.style.setProperty('padding-right', input.style.paddingRight);
    }

    /* Restore transition and animation properties in the next rendering frame
     * to ensure they work as expected. */
    requestAnimationFrame(() => {
        input.style.setProperty('transition', transition);
        input.style.setProperty('animation', animation);
    });
};

/* The injection styles application is a two pass process :
 * - First correctly position the control element by computing
 *   its possible margin left offset + max width
 * - Use the re-renderer control element for positioning the icon
 * + Pre-compute shared styles and DOMRects between two passes */
export const applyInjectionStyles = (refs: IconElementRefs) => {
    cleanupInputInjectedStyles(refs.input);
    applyIconInjectionStyles(refs, {
        getInputStyle: createStyleParser(refs.input),
        getAnchorStyle: createStyleParser(refs.anchor),
    });
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
