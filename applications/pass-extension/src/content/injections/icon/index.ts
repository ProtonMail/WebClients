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

/**
 * Sometimes the input is displayed as inline-block
 * and may be positioned using text alignment properties,
 * in that case make sure to account for margin left
 */
const computeWrapperInjectionStyles = (
    { wrapper, input }: InjectionElements,
    { inputBox, getInputStyle }: SharedInjectionOptions
) => {
    const { left: boxLeft } = inputBox.getBoundingClientRect();
    const { left: wrapperLeft } = wrapper.getBoundingClientRect();
    const inputDisplay = getInputStyle('display');

    return {
        maxWidth: pixelEncoder(getComputedWidth(getInputStyle, { node: input, mode: 'outer' }).value),
        marginLeft: inputDisplay === 'inline-block' ? pixelEncoder(boxLeft - wrapperLeft) : '0px',
    };
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

    const { right: inputRight } = input.getBoundingClientRect();
    const { top: boxTop } = inputBox.getBoundingClientRect();
    const { top: wrapperTop, right: wrapperRight } = wrapper.getBoundingClientRect();

    const { value: inputWidth } = getComputedWidth(getInputStyle, { node: input, mode: 'outer' });

    /* If inputBox is not the input element in the case we
     * resolved a bounding element : compute inner height
     * without offsets in order to correctly position icon
     * if bounding element has some padding-top/border-top */
    const { value: boxHeight, offset: boxOffset } = getComputedHeight(getBoxStyle, { node: inputBox, mode: 'outer' });

    /* FIXME: if the input is "boxed", we may hit a case where the
     * bounding box grows with any margins applied to the child
     * input. In this case subtract it from the boxHeight so as
     * to compute the icon's top position correctly
     * const safeHeight = boxHeight - inputOffset.bottom; */
    const size = Math.max(Math.min(boxHeight - ICON_MIN_HEIGHT, ICON_MAX_HEIGHT), ICON_MIN_HEIGHT);

    const pl = getInputStyle('padding-left', pixelParser);
    const pr = getInputStyle('padding-right', pixelParser);

    /* `mt` represents the vertical offset needed to align the
     * center of the injected icon with the top-most part of
     * the bounding box */
    const mt = boxTop - boxOffset.top - wrapperTop - size / 2;
    const top = mt + boxHeight / 2;

    /* Compute the new input padding :
     * Take into account the input element's current
     * padding as we may be dealing with another
     * input icon (ie: show password "eye") */
    const newPaddingRight = pr + ICON_PADDING + size;

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
            right: pixelEncoder(wrapperRight - inputRight + pr),
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

/**
 * ⚠️ Apply float styles before computing
 * the injected wrapper styles so we account
 * for its new "floating" position
 */
const applyWrapperInjectionStyles = (elements: InjectionElements, shared: SharedInjectionOptions) => {
    const { wrapper } = elements;
    wrapper.style.setProperty('float', 'right');

    const { maxWidth, marginLeft } = computeWrapperInjectionStyles(elements, shared);
    wrapper.style.maxWidth = maxWidth;
    wrapper.style.setProperty('margin-left', marginLeft, 'important');
};

const applyIconInjectionStyles = (elements: InjectionElements, shared: SharedInjectionOptions) => {
    const { icon, input } = elements;
    const inputWidthBefore = input.getBoundingClientRect().width;
    const styles = computeIconInjectionStyles(elements, shared);

    icon.style.top = styles.icon.top;
    icon.style.right = styles.icon.right;
    icon.style.width = styles.icon.size;
    icon.style.height = styles.icon.size;
    icon.style.backgroundImage = `url("${ACTIVE_ICON_SRC}")`;

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

    applyWrapperInjectionStyles(elements, sharedOptions);
    applyIconInjectionStyles(elements, sharedOptions);
};

export const createIcon = (field: FieldHandle): InjectionElements => {
    const input = field.element as HTMLInputElement;
    const inputBox = field.boxElement;

    const inputParent = input.parentElement as HTMLElement;
    const boxed = inputBox !== input;
    const root = boxed ? inputBox : inputParent;
    const target = boxed ? inputBox.lastElementChild : input;

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

    icon.style.zIndex = field.getFormHandle().props.injections.zIndex.toString();
    icon.setAttribute('type', 'button');

    const elements = { icon, wrapper, input, inputBox };

    requestAnimationFrame(() => {
        if (boxed) root.appendChild(wrapper);
        else root.insertBefore(wrapper, target);

        wrapper.appendChild(icon);
        applyInjectionStyles(elements);
    });

    return elements;
};
