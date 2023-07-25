import { createElement } from '@proton/pass/utils/dom';

import type { ProtonPassRoot } from '../custom-elements/ProtonPassRoot';

export const getIFrameRoot = () => document.querySelector<ProtonPassRoot>('protonpass-root');
export const isIFrameRootAttached = () => getIFrameRoot() !== null;

export const createIframeRoot = (): ProtonPassRoot => {
    const root = getIFrameRoot();
    if (root !== null) return root;

    const iframeRoot = createElement<ProtonPassRoot>({ type: 'protonpass-root', parent: document.body });

    /* we may hit a case where the content-script is reloaded - on
     * firefox, this will cause our injected stylesheets to be removed
     * from the DOM and induce a small flickering glitch. To be safe
     * hide the iframe root by default, this value is override in the
     * `iframe.scss` */
    iframeRoot.style.display = 'none';

    return iframeRoot;
};
