import tinycolor from 'tinycolor2';

interface ScriptInfo {
    path: string;
    integrity?: string;
}

interface Callback {
    (event?: Event, error?: string | Event): void;
}

const loadScriptHelper = ({ path, integrity }: ScriptInfo, cb: Callback) => {
    const script = document.createElement('script');

    script.src = path;
    if (integrity) {
        script.integrity = integrity;
    }
    script.onload = (e) => {
        cb(e);
        script.remove();
    };
    script.onerror = (e) => cb(undefined, e);

    document.head.appendChild(script);
};

export const loadScript = (path: string, integrity?: string) => {
    return new Promise<Event>((resolve, reject) => {
        loadScriptHelper({ path, integrity }, (event, error) => {
            if (error || !event) {
                return reject(error);
            }
            return resolve(event);
        });
    });
};

/**
 * Returns whether the element is a node.
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType}
 */
export const isElement = (node: Node | null) => node && node.nodeType === 1;

/**
 * Returns the node if it's an element or the parent element if not
 */
export const getElement = (node: Node | null) => (isElement(node) ? (node as Element) : node?.parentElement || null);

/**
 * From https://stackoverflow.com/a/42543908
 */
export const getScrollParent = (element: HTMLElement | null | undefined, includeHidden = false) => {
    if (!element) {
        return document.body;
    }

    const style = getComputedStyle(element);
    const excludeStaticParent = style.position === 'absolute';
    const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

    if (style.position === 'fixed') {
        return document.body;
    }

    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (excludeStaticParent && style.position === 'static') {
            continue;
        }
        if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
            return parent;
        }
    }

    return document.body;
};

/**
 * get computed root font size, to manage properly some elements in pixels
 * Base font size on the body is 14, default browser font size is 16,
 * so we take the body computed font size and find computed root's one
 */
export const rootFontSize = ((parseInt(window.getComputedStyle(document.body).fontSize, 10) || 14) * 16) / 14;

/**
 * Firefox <58 does not support block: 'nearest' and just throws
 */
export const scrollIntoView = (element: HTMLElement | undefined | null, extra?: boolean | ScrollIntoViewOptions) => {
    if (!element) {
        return;
    }
    try {
        element.scrollIntoView(extra);
        // eslint-disable-next-line no-empty
    } catch (e: any) {}
};

export const hasChildren = (node?: ChildNode) => {
    return node && node.childNodes && node.childNodes.length > 0;
};

export const getMaxDepth = (node: ChildNode) => {
    let maxDepth = 0;
    for (const child of node.childNodes) {
        if (hasChildren(child)) {
            const depth = getMaxDepth(child);
            if (depth > maxDepth) {
                maxDepth = depth;
            }
        }
    }
    return maxDepth + 1;
};

export const checkContrast = (node: ChildNode, window: Window): boolean => {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const style = window.getComputedStyle(node as Element);
        const color = style.color ? tinycolor(style.color) : tinycolor('#fff');
        const background = style.backgroundColor ? tinycolor(style.backgroundColor) : tinycolor('#000');
        const result =
            (color?.isDark() && (background?.isLight() || background?.getAlpha() === 0)) ||
            (color?.isLight() && background?.isDark());

        if (!result) {
            return false;
        }
    }
    return [...node.childNodes].every((node) => checkContrast(node, window));
};

export const getIsEventModified = (event: MouseEvent) => {
    return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
};

export const isVisible = (element: HTMLElement | null) => {
    if (!element) {
        return false;
    }

    const style = getComputedStyle(element);
    const { offsetWidth, offsetHeight } = element;
    const { width, height } = element.getBoundingClientRect();

    if (style.display === 'none') {
        return false;
    }

    if (style.visibility !== 'visible') {
        return false;
    }

    if ((style.opacity as any) === 0) {
        return false;
    }

    if (offsetWidth + offsetHeight + height + width === 0) {
        return false;
    }

    return true;
};
