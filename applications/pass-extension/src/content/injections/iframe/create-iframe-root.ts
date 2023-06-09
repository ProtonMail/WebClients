import { createElement } from '@proton/pass/utils/dom';

import { EXTENSION_PREFIX } from '../../constants';

export const getIFrameRoot = () => document.querySelector<HTMLDivElement>(`#${EXTENSION_PREFIX}-iframe--root`);
export const isIFrameRootAttached = () => getIFrameRoot() !== null;

export const createIframeRoot = (): HTMLDivElement => {
    const root = getIFrameRoot();

    if (root !== null) {
        return root;
    }

    const iframeRoot = createElement<HTMLDivElement>({
        type: 'aside',
        parent: document.body,
        attributes: { id: `${EXTENSION_PREFIX}-iframe--root` },
    });

    /* we may hit a case where the content-script is reloaded - on
     * firefox, this will cause our injected stylesheets to be removed
     * from the DOM and induce a small flickering glitch. To be safe
     * hide the iframe root by default, this value is override in the
     * `iframe.scss` */
    iframeRoot.style.display = 'none';

    return iframeRoot;
};
