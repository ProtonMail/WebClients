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
export const isElement = (node: Node | null): node is Element => Boolean(node && node.nodeType === 1);

/**
 * Returns the node if it's an element or the parent element if not
 */
export const getElement = (node: Node | null) => (isElement(node) ? (node as Element) : node?.parentElement || null);

/**
 * From https://stackoverflow.com/a/42543908
 *
 * Note that a scrolling overflow value alone isn't enough to identify the scroll
 * container: layouts routinely nest `overflow: auto` wrappers that never overflow inside
 * the element that actually scrolls, and returning one of those gives a node whose
 * scrollTop is permanently 0. So an ancestor that overflows right now wins.
 *
 * Nothing overflowing yet doesn't mean there's no scroll container, though — content may
 * still be arriving. Falling back to the scrolling root there would be wrong in an app
 * layout, where the document itself never scrolls, so the nearest ancestor that could
 * scroll is the better guess.
 */
export const getScrollParent = (element: HTMLElement | null | undefined, includeHidden = false) => {
    const root = document.scrollingElement ?? document.documentElement;

    if (!element) {
        return root;
    }

    const style = getComputedStyle(element);
    const excludeStaticParent = style.position === 'absolute';
    const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

    if (style.position === 'fixed') {
        return root;
    }

    // Fallbacks for when no ancestor overflows vertically, in decreasing order of confidence.
    let scrollsHorizontally: HTMLElement | undefined;
    let couldScroll: HTMLElement | undefined;

    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (excludeStaticParent && style.position === 'static') {
            continue;
        }
        if (!overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
            continue;
        }
        if (parent.scrollHeight > parent.clientHeight) {
            return parent;
        }
        if (!scrollsHorizontally && parent.scrollWidth > parent.clientWidth) {
            scrollsHorizontally = parent;
        }
        if (!couldScroll) {
            couldScroll = parent;
        }
    }

    return scrollsHorizontally ?? couldScroll ?? root;
};

/**
 * get computed root font size, to manage properly some elements in pixels
 * value is dynamic
 */
let rootFontSizeCache: number | undefined = undefined;

const getRootFontSize = () => {
    return parseFloat(window.getComputedStyle(document.querySelector('html') as Element).getPropertyValue('font-size'));
};

export const rootFontSize = (reset?: boolean) => {
    if (rootFontSizeCache === undefined || reset === true) {
        rootFontSizeCache = getRootFontSize();
    }
    return rootFontSizeCache;
};

/**
 * Firefox <58 does not support block: 'nearest' and just throws
 */
export const scrollIntoView = (element: HTMLElement | undefined | null, extra?: boolean | ScrollIntoViewOptions) => {
    if (!element) {
        return;
    }
    try {
        element.scrollIntoView(extra);
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

export const isVisibleOnScreen = (element: HTMLElement | null) => {
    if (!element) {
        return false;
    }

    var rect = element.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
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

export const parseStringToDOM = (content: string, type: DOMParserSupportedType = 'text/html') => {
    const parser = new DOMParser();
    return parser.parseFromString(content, type);
};

export const getShouldProcessLinkClick = (event: MouseEvent, target?: string) => {
    return (
        event.button === 0 && // Ignore everything but left clicks
        (!target || target === '_self') && // Let browser handle "target=_blank" etc.
        !getIsEventModified(event) // Ignore clicks with modifier keys
    );
};

export const isDocumentVisible = () => {
    return document.visibilityState === 'visible';
};
