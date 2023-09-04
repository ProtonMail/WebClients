const ending = '.ltr.css';

const getIsNonEnding = (src: string) => {
    const targetOrigin = window.location.origin;
    const url = new URL(src, targetOrigin);
    return url.origin === targetOrigin && url.pathname.endsWith('.css') && !url.pathname.endsWith(ending);
};

export const queryLocalLinkElements = () => {
    return [...document.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]')].filter((node) => {
        return getIsNonEnding(node.href);
    });
};

const mutateLinkElement = (el: HTMLLinkElement) => {
    el.href = el.href.replace(/\.css/, ending);
};

const getIsNonEndingLinkElement = (node: Node): node is HTMLLinkElement => {
    return (
        node &&
        node.nodeType === 1 &&
        node instanceof HTMLLinkElement &&
        node.tagName === 'LINK' &&
        node.rel === 'stylesheet' &&
        getIsNonEnding(node.href)
    );
};

const initLogicalProperties = () => {
    if (CSS.supports('(border-start-start-radius: 1em)')) {
        return;
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (getIsNonEndingLinkElement(node)) {
                    mutateLinkElement(node);
                }
            });
        });
    });

    queryLocalLinkElements().forEach(mutateLinkElement);

    observer.observe(document.head, {
        childList: true,
        subtree: true,
    });
};

export default initLogicalProperties;
