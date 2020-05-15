interface ScriptInfo {
    path: string;
    integrity: string;
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

export const loadScript = (path: string, integrity: string) => {
    return new Promise<Event>((resolve, reject) => {
        loadScriptHelper({ path, integrity }, (event, error) => {
            if (error) {
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
