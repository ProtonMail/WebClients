export const createElement = <T extends HTMLElement = HTMLElement>(options: {
    type: string;
    classNames?: string[];
    parent?: HTMLElement;
    attributes?: { [K in keyof T]?: string };
    shadow?: boolean;
}): T => {
    const el = document.createElement(options.type);
    options.classNames?.forEach((className) => el.classList.add(className));

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, attr]) => el.setAttribute(key, attr));
    }

    if (options.parent && !options.shadow) options.parent.appendChild(el);
    if (options.parent && options.shadow) options.parent.shadowRoot?.appendChild(el);

    return el as T;
};
