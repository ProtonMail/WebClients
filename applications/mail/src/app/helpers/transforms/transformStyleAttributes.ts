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

// some emails are using left and top to hide content, so we remove these properties
const replaceLeftTopProperties = (element: HTMLElement) => {
    const left = element.style.left;
    const top = element.style.top;

    if (left) {
        element.style.left = 'unset';

        // additionnal fix for some emails that moreother do perform a sr-only-like on their content (🤦)
        const width = element.style.width;
        const height = element.style.height;

        if (width === '1px' && height === '1px') {
            element.style.width = 'auto';
            element.style.height = 'auto';
        }
    }
    if (top) {
        element.style.top = 'unset';
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
    }
};
