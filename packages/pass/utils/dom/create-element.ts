export const createElement = <T extends HTMLElement = HTMLElement>(options: {
    type: string;
    classNames?: string[];
    parent?: HTMLElement | ShadowRoot;
    attributes?: { [K in keyof T]?: string };
}): T => {
    const el = document.createElement(options.type);
    options.classNames?.forEach((className) => el.classList.add(className));

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, attr]) => el.setAttribute(key, attr));
    }

    if (options.parent) options.parent.appendChild(el);

    return el as T;
};

export type CustomElementRef<T extends HTMLElement> = {
    customElement: T;
    shadowRoot: ShadowRoot;
};

export const createCustomElement = <T extends HTMLElement>(options: {
    type: string;
    classNames?: string[];
    parent?: HTMLElement | ShadowRoot;
    attributes?: { [K in keyof T]?: string };
    styles?: string;
}): CustomElementRef<T> => {
    const customElement = document.createElement(options.type) as T;
    const shadowRoot = customElement.attachShadow({ mode: 'closed' });

    options.classNames?.forEach((className) => customElement.classList.add(className));

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, attr]) => {
            customElement.setAttribute(key, attr);
        });
    }

    if (options.styles) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(options.styles);
        shadowRoot.adoptedStyleSheets.push(sheet);
    }

    if (options.parent) options.parent.appendChild(customElement);

    return { customElement, shadowRoot };
};
