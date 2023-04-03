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

export const transformStyleAttributes = (document: Element) => {
    const nodesWithStyleAttribute = document.querySelectorAll('[style]');

    for (const element of nodesWithStyleAttribute) {
        if (!isHTMLElement(element)) {
            continue;
        }

        replaceViewportHeightUnit(element);
    }
};
