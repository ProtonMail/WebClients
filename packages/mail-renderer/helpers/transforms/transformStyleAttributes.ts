const isHTMLElement = (element: Element): element is HTMLElement => 'style' in element;

const replaceViewportHeightUnit = (element: HTMLElement) => {
    const height = element.style.height;
    if (!height) {
        return;
    }

    if (height.includes('vh')) {
        element.style.height = 'auto';
    }
};

// had to extract the method, only because some testing issues
export const handleTopLeftPropertiesRemoval = ({ left, top }: Record<'top' | 'left', string>): Map<string, string> => {
    const result = new Map();
    if (left) {
        result.set('left', 'unset');
    }
    if (top) {
        result.set('top', 'unset');
    }
    return result;
};

// some emails are using left and top to hide content, so we remove these properties
const replaceLeftTopProperties = (element: HTMLElement) => {
    const left = element.style.left;
    const top = element.style.top;

    if (left) {
        // additionnal fix for some emails that moreother do perform a sr-only-like on their content (🤦)
        const width = element.style.width;
        const height = element.style.height;

        if (width === '1px' && height === '1px') {
            element.style.width = 'auto';
            element.style.height = 'auto';
        }
    }

    const results = handleTopLeftPropertiesRemoval({ top, left });

    results.forEach((value, property) => {
        // @ts-expect-error // we send valid properties
        element.style[property] = value;
    });
};

// starts by (optionnal spaces), a negative sign, some numbers, decimal part not mandatory (only to test CSS stuff, don't use it)
export const startsByANegativeSign = (string: string) => {
    return /^\s*-\d+(\.\d+)?/.test(string);
};

// had to extract the method, only because some testing issues
export const handleNegativeMarginRemoval = ({
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    marginInlineStart,
    marginInlineEnd,
    marginBlockStart,
    marginBlockEnd,
}: Record<
    | 'marginLeft'
    | 'marginRight'
    | 'marginTop'
    | 'marginBottom'
    | 'marginInlineStart'
    | 'marginInlineEnd'
    | 'marginBlockStart'
    | 'marginBlockEnd',
    string
>): Map<string, string> => {
    const result = new Map();
    if (marginLeft && startsByANegativeSign(marginLeft)) {
        result.set('marginLeft', 'unset');
    }
    if (marginRight && startsByANegativeSign(marginRight)) {
        result.set('marginRight', 'unset');
    }
    if (marginTop && startsByANegativeSign(marginTop)) {
        result.set('marginTop', 'unset');
    }
    if (marginBottom && startsByANegativeSign(marginBottom)) {
        result.set('marginBottom', 'unset');
    }
    if (marginInlineStart && startsByANegativeSign(marginInlineStart)) {
        result.set('marginInlineStart', 'unset');
    }
    if (marginInlineEnd && startsByANegativeSign(marginInlineEnd)) {
        result.set('marginInlineEnd', 'unset');
    }
    if (marginBlockStart && startsByANegativeSign(marginBlockStart)) {
        result.set('marginBlockStart', 'unset');
    }
    if (marginBlockEnd && startsByANegativeSign(marginBlockEnd)) {
        result.set('marginBlockEnd', 'unset');
    }
    return result;
};

// some emails are using left and top to hide content, so we remove these properties only if using negative values
// gmail and some others are doing the same https://www.caniemail.com/search/?s=margin
export const removeNegativeMargins = (element: HTMLElement) => {
    const marginLeft = element.style.marginLeft;
    const marginRight = element.style.marginRight;
    const marginTop = element.style.marginTop;
    const marginBottom = element.style.marginBottom;
    const marginInlineStart = element.style.marginInlineStart;
    const marginInlineEnd = element.style.marginInlineEnd;
    const marginBlockStart = element.style.marginBlockStart;
    const marginBlockEnd = element.style.marginBlockEnd;

    const results = handleNegativeMarginRemoval({
        marginLeft,
        marginRight,
        marginTop,
        marginBottom,
        marginInlineStart,
        marginInlineEnd,
        marginBlockStart,
        marginBlockEnd,
    });

    results.forEach((value, property) => {
        // @ts-expect-error // we send valid properties
        element.style[property] = value;
    });
};

// some emails are using white-space: pre in text contents, we replace it with pre-wrap so text is not overflowing (same as gmail does)
const replaceWhiteSpacePre = (element: HTMLElement) => {
    const whiteSpace = element.style.whiteSpace;
    if (whiteSpace === 'pre') {
        element.style.whiteSpace = 'pre-wrap';
    }
};

export const transformStyleAttributes = (document: Element) => {
    const nodesWithStyleAttribute = document.querySelectorAll('[style]');

    for (const element of nodesWithStyleAttribute) {
        if (!isHTMLElement(element)) {
            continue;
        }

        replaceViewportHeightUnit(element);

        replaceLeftTopProperties(element);

        removeNegativeMargins(element);

        replaceWhiteSpacePre(element);
    }
};
