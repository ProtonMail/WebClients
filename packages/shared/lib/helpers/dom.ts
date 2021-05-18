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
export const rootFontSize = (parseInt(window.getComputedStyle(document.body).fontSize, 10) * 16) / 14;
