import type { MaybeNull } from '@proton/pass/types';
import type { BoundComputeStyles } from '@proton/pass/utils/dom';
import {
    createElement,
    createStyleCompute,
    getComputedHeight,
    pixelEncoder,
    pixelParser,
    repaint,
} from '@proton/pass/utils/dom';

import { ICON_MAX_HEIGHT, ICON_MIN_HEIGHT, ICON_PADDING, INPUT_BASE_STYLES_ATTR } from '../../constants';
import type { FieldHandle } from '../../types';
import type { ProtonPassControl } from '../custom-elements/ProtonPassControl';

type InjectionElements = {
    form: HTMLElement;
    input: HTMLInputElement;
    inputBox: HTMLElement;
    icon: HTMLButtonElement;
    control: ProtonPassControl;
};

type SharedInjectionOptions = {
    inputBox: HTMLElement;
    getInputStyle: BoundComputeStyles;
    getBoxStyle: BoundComputeStyles;
};

/* input styles we may override */
type InputInitialStyles = { ['padding-right']?: string };

const getOverlayedElement = (options: {
    x: number;
    y: number;
    inputBox: HTMLElement;
    form: HTMLElement;
}): MaybeNull<HTMLElement> => {
    try {
        const { x, y, form, inputBox } = options;
        const maxWidth = inputBox.offsetWidth;

        if (Number.isNaN(x) || Number.isNaN(y)) return null;
        const overlays = Array.from(document.elementsFromPoint(x, y));

        return (
            overlays.find((el): el is HTMLElement => {
                /* exclude non-html elements */
                if (!(el instanceof HTMLElement)) return false;
                /* exclude svg elements */
                if (el.matches('svg *')) return false;
                /* exclude our own injected elements */
                if (el.matches('protonpass-control')) return false;
                /* exclude elements not in the current form stack */
                if (!form.contains(el)) return false;
                /* exclude "placeholder" overlays */
                if (el.innerText.length > 0 && el.offsetWidth >= maxWidth * 0.85) return false;

                return true;
            }) ?? null
        );
    } catch (e) {
        return null;
    }
};

/* Force re-render/re-paint of the input element
 * before computing the icon injection styles in
 * order to avoid certain browser rendering optimisations
 * which cause incorrect DOMRect / styles to be resolved.
 * ie: check amazon sign-in page without repaint to
 * reproduce issue */
const computeIconInjectionStyles = (
    { input, control, form }: Omit<InjectionElements, 'icon'>,
    { getInputStyle, getBoxStyle, inputBox }: SharedInjectionOptions
) => {
    repaint(input);

    const { right: inputRight, top: inputTop, height: inputHeight } = input.getBoundingClientRect();
    const { top: boxTop, height: boxMaxHeight } = inputBox.getBoundingClientRect();
    const { top: controlTop, right: controlRight } = control.getBoundingClientRect();

    /* If inputBox is not the input element in the case we
     * resolved a bounding element : compute inner height
     * without offsets in order to correctly position icon
     * if bounding element has some padding-top/border-top */
    const boxed = inputBox !== input;
    const { value: boxHeight, offset: boxOffset } = getComputedHeight(getBoxStyle, {
        node: inputBox,
        mode: boxed ? 'inner' : 'outer',
    });

    const size = Math.max(Math.min(boxMaxHeight - ICON_PADDING, ICON_MAX_HEIGHT), ICON_MIN_HEIGHT);
    const pl = getInputStyle('padding-left', pixelParser);
    const pr = getInputStyle('padding-right', pixelParser);
    const iconPaddingLeft = size / 5; /* dynamic "responsive" padding */
    const iconPaddingRight = Math.max(Math.min(pl, pr) / 1.5, iconPaddingLeft);

    /* look for any overlayed elements if we were to inject
     * the icon on the right hand-side of the input element
     * accounting for icon size and padding  */
    const overlayEl = getOverlayedElement({
        x: inputRight - (iconPaddingRight + size / 2),
        y: inputTop + inputHeight / 2,
        inputBox,
        form,
    });

    const overlayWidth = overlayEl?.clientWidth ?? 0;
    const overlayDx = overlayEl !== input && overlayWidth !== 0 ? overlayWidth + iconPaddingLeft : 0;

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
    const right = controlRight - inputRight + iconPaddingRight + overlayDx;

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

export const cleanupInjectionStyles = ({ control, input }: Pick<InjectionElements, 'control' | 'input'>) => {
    control.style.removeProperty('float');
    control.style.removeProperty('max-width');
    control.style.removeProperty('margin-left');
    cleanupInputInjectedStyles(input);
};

const applyIconInjectionStyles = (elements: InjectionElements, shared: SharedInjectionOptions) => {
    const { icon, input } = elements;
    const styles = computeIconInjectionStyles(elements, shared);
    const widthBefore = input.getBoundingClientRect().width;

    icon.style.top = styles.icon.top;
    icon.style.right = styles.icon.right;
    icon.style.width = styles.icon.size;
    icon.style.height = styles.icon.size;
    icon.style.setProperty(`--control-lineheight`, styles.icon.size);
    icon.style.setProperty(`--control-fontsize`, pixelEncoder(styles.icon.fontSize));

    /* Content-script may be destroyed and re-injected
     * on extension update or on code hot-reload. Keep
     * track of the previous input styles for clean-up */
    input.setAttribute(INPUT_BASE_STYLES_ATTR, JSON.stringify({ 'padding-right': input.style.paddingRight }));
    input.style.setProperty('padding-right', styles.input.paddingRight, 'important');
    const widthAfter = input.getBoundingClientRect().width;

    /* when dealing with `content-box` box-sized elements or certain
     * flexbox edge-cases : adapting the padding may lead to input width
     * growing - if we detect this: remove the padding override. */
    if (widthAfter !== widthBefore) {
        input.style.removeProperty('padding-right');
        input.style.setProperty('padding-right', input.style.paddingRight);
    }
};

/* The injection styles application is a two pass process :
 * - First correctly position the control element by computing
 *   its possible margin left offset + max width
 * - Use the re-renderer control element for positioning the icon
 * + Pre-compute shared styles and DOMRects between two passes */
export const applyInjectionStyles = (elements: InjectionElements) => {
    const { input, inputBox } = elements;
    cleanupInputInjectedStyles(input);

    const sharedOptions = {
        inputBox,
        getInputStyle: createStyleCompute(input),
        getBoxStyle: createStyleCompute(inputBox),
    };

    applyIconInjectionStyles(elements, sharedOptions);
};

export const createIcon = (field: FieldHandle): InjectionElements => {
    const input = field.element as HTMLInputElement;
    const inputBox = field.boxElement;

    const control = createElement<ProtonPassControl>({ type: 'protonpass-control' });

    /* overridden by `injection.scss` in order to properly handle
     * content-script re-injection flickering glitch */
    control.style.display = 'none';

    const icon = createElement<HTMLButtonElement>({
        type: 'button',
        classNames: [],
    });

    icon.tabIndex = -1;
    icon.style.zIndex = field.zIndex.toString();
    icon.setAttribute('type', 'button');

    const elements = { icon, control, input, inputBox, form: field.getFormHandle().element };
    const boxed = input !== inputBox;

    if (boxed) inputBox.insertBefore(control, inputBox.firstElementChild);
    else input.parentElement!.insertBefore(control, input);

    control.shadowRoot?.appendChild(icon);
    applyInjectionStyles(elements);

    return elements;
};
