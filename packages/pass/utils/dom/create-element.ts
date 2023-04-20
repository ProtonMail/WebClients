export const createElement = <T extends HTMLElement = HTMLElement>(options: {
    type: keyof HTMLElementTagNameMap;
    classNames?: string[];
    parent?: HTMLElement;
    attributes?: { [K in keyof T]?: string };
}): T => {
    const el = document.createElement(options.type);
    options.classNames?.forEach((className) => el.classList.add(className));

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, attr]) => el.setAttribute(key, attr));
    }

    if (options.parent) {
        options.parent.appendChild(el);
    }

    return el as T;
};
