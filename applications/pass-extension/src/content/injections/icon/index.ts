import type { MaybeNull } from '@proton/pass/types';
import type { BoundComputeStyles } from '@proton/pass/utils/dom';
import {
    createElement,
    createStyleCompute,
    getComputedHeight,
    getComputedWidth,
    pixelEncoder,
    pixelParser,
    pixelTransformer,
    repaint,
} from '@proton/pass/utils/dom';

import {
    ACTIVE_ICON_SRC,
    EXTENSION_PREFIX,
    ICON_CLASSNAME,
    ICON_MAX_HEIGHT,
    ICON_MIN_HEIGHT,
    ICON_PADDING,
    ICON_ROOT_CLASSNAME,
    ICON_WRAPPER_CLASSNAME,
    INPUT_STYLES_ATTR,
} from '../../constants';
import type { FieldHandle } from '../../types';

type InjectionElements = {
    icon: HTMLButtonElement;
    input: HTMLInputElement;
    inputBox: HTMLElement;
    wrapper: HTMLElement;
};

type SharedInjectionOptions = {
    inputBox: HTMLElement;
    getInputStyle: BoundComputeStyles;
    getBoxStyle: BoundComputeStyles;
};

/* input styles we may override */
type InputInitialStyles = {
    width?: string;
    ['max-width']?: string;
    ['padding-right']?: string;
};

const getOverlayedElement = (options: { x: number; y: number; parent: HTMLElement }): MaybeNull<HTMLElement> => {
    try {
        const { x, y, parent } = options;
        if (Number.isNaN(x) || Number.isNaN(y)) return null;
        const overlays = Array.from(document.elementsFromPoint(x, y) as HTMLElement[]);
        const candidates = overlays.filter((el) => !el.matches(`.${ICON_CLASSNAME}`) && parent.contains(el));

        return candidates?.[0] ?? null;
    } catch (_) {
        return null;
    }
};

/* Force re-render/re-paint of the input element
 * before computing the icon injection styles in
 * order to avoid certain browser rendering optimisations
 * which cause incorrect DOMRect / styles to be resolved */
const computeIconInjectionStyles = (
    { input, wrapper }: Omit<InjectionElements, 'icon'>,
    { getInputStyle, getBoxStyle, inputBox }: SharedInjectionOptions
) => {
    repaint(input);

    const { right: inputRight, top: inputTop, height: inputHeight } = input.getBoundingClientRect();
    const { top: boxTop } = inputBox.getBoundingClientRect();
    const { top: wrapperTop, right: wrapperRight } = wrapper.getBoundingClientRect();

    const { value: inputWidth } = getComputedWidth(getInputStyle, { node: input, mode: 'outer' });

    /* If inputBox is not the input element in the case we
     * resolved a bounding element : compute inner height
     * without offsets in order to correctly position icon
     * if bounding element has some padding-top/border-top */
    const boxed = inputBox !== input;
    const { value: boxHeight, offset: boxOffset } = getComputedHeight(getBoxStyle, {
        node: inputBox,
        mode: boxed ? 'inner' : 'outer',
    });

    const size = Math.max(Math.min(boxHeight - ICON_MIN_HEIGHT, ICON_MAX_HEIGHT), ICON_MIN_HEIGHT);
    const pl = getInputStyle('padding-left', pixelParser);
    const pr = getInputStyle('padding-right', pixelParser);
    const safePr = pr === 0 ? ICON_PADDING : pr;

    /* `mt` represents the vertical offset needed to align the
     * center of the injected icon with the top-most part of
     * the bounding box :
     * mt = boxTop - boxOffset.top - wrapperTop - size / 2
     * top = mt + boxHeight / 2 */
    const top = boxTop - wrapperTop + boxOffset.top + (boxHeight - size) / 2;

    const overlayEl = getOverlayedElement({
        x: inputRight - pr - size / 2,
        y: inputTop + inputHeight / 2,
        parent: inputBox.parentElement!,
    });

    const overlayWidth = overlayEl?.clientWidth ?? 0;
    const overlayDx = overlayEl !== input && overlayWidth !== 0 ? overlayWidth + 5 : 0;

    /* Compute the new input padding :
     * Take into account the input element's current
     * padding as we may be dealing with another
     * input icon (ie: show password "eye") */
    const newPaddingRight = pr + ICON_PADDING + size + overlayDx;

    /* When dealing with input elements that are
     * of type box-sizing: content-box - updating
     * the padding will cause the input box to grow.
     * In order to avoid this, substract the horizontal
     * paddings and the vertical borders from the previously
     * computed input width */
    const isContentBox = getInputStyle('box-sizing', String) === 'content-box';
    const blw = getInputStyle('border-left-width', pixelParser);
    const brw = getInputStyle('border-right-width', pixelParser);
    const computedWidth = inputWidth - newPaddingRight - pl - (blw + brw);
    const newWidth = isContentBox ? computedWidth : getInputStyle('width', pixelParser);

    return {
        input: {
            width: pixelEncoder(newWidth),
            paddingRight: pixelEncoder(newPaddingRight),
        },
        icon: {
            top: pixelEncoder(top),
            right: pixelEncoder(wrapperRight - inputRight + safePr + overlayDx),
            size: pixelEncoder(size),
        },
    };
};

export const getInputInitialStyles = (el: HTMLElement): InputInitialStyles => {
    const initialStyles = el.getAttribute(INPUT_STYLES_ATTR);
    return initialStyles ? JSON.parse(initialStyles) : {};
};

export const cleanupInputInjectedStyles = (input: HTMLInputElement) => {
    Object.entries(getInputInitialStyles(input)).forEach(
        ([prop, value]) =>
            Boolean(value)
                ? input.style.setProperty(prop, value) /* if has initial style -> reset */
                : input.style.removeProperty(prop) /* else remove override */
    );

    input.removeAttribute(INPUT_STYLES_ATTR);
};

export const cleanupInjectionStyles = ({ wrapper, input }: Pick<InjectionElements, 'wrapper' | 'input'>) => {
    wrapper.style.removeProperty('float');
    wrapper.style.removeProperty('max-width');
    wrapper.style.removeProperty('margin-left');
    cleanupInputInjectedStyles(input);
};

const applyIconInjectionStyles = (elements: InjectionElements, shared: SharedInjectionOptions) => {
    const { icon, input } = elements;
    const inputWidthBefore = input.getBoundingClientRect().width;
    const styles = computeIconInjectionStyles(elements, shared);

    icon.style.top = styles.icon.top;
    icon.style.right = styles.icon.right;
    icon.style.width = styles.icon.size;
    icon.style.height = styles.icon.size;
    icon.style.setProperty('background-image', `url("${ACTIVE_ICON_SRC}")`, 'important');
    icon.style.setProperty(`--${EXTENSION_PREFIX}-icon-lineheight`, styles.icon.size);
    icon.style.setProperty(
        `--${EXTENSION_PREFIX}-icon-fontsize`,
        pixelTransformer(styles.icon.size, (size) => size / 2.2)
    );

    /* Content-script may be destroyed and re-injected
     * on extension update or on code hot-reload. Keep
     * track of the previous input styles for clean-up */
    const initialInputStyles: InputInitialStyles = {
        width: input.style.width,
        'max-width': input.style.maxWidth,
        'padding-right': input.style.paddingRight,
    };

    input.setAttribute(INPUT_STYLES_ATTR, JSON.stringify(initialInputStyles));
    input.style.setProperty('padding-right', styles.input.paddingRight, 'important');
    const inputWidthAfter = input.getBoundingClientRect().width;

    if (shared.getInputStyle('box-sizing') === 'content-box' || inputWidthBefore !== inputWidthAfter) {
        input.style.setProperty('width', styles.input.width, 'important');
        input.style.setProperty('max-width', styles.input.width, 'important');
    }
};

/* The injection styles application is a two pass process :
 * - First correctly position the wrapper element by computing
 *   its possible margin left offset + max width
 * - Use the re-renderer wrapper element for positioning the icon
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

    const wrapper = createElement<HTMLDivElement>({
        type: 'div',
        classNames: [ICON_ROOT_CLASSNAME, ICON_WRAPPER_CLASSNAME],
    });

    /* overridden by `injection.scss` in order to properly handle
     * content-script re-injection flickering glitch */
    wrapper.style.display = 'none';

    const icon = createElement<HTMLButtonElement>({
        type: 'button',
        classNames: [ICON_ROOT_CLASSNAME, ICON_CLASSNAME],
    });

    icon.tabIndex = -1;
    icon.style.zIndex = field.zIndex.toString();
    icon.setAttribute('type', 'button');

    const elements = { icon, wrapper, input, inputBox };

    input.parentElement!.insertBefore(wrapper, input.nextSibling);
    wrapper.appendChild(icon);
    applyInjectionStyles(elements);

    return elements;
};
