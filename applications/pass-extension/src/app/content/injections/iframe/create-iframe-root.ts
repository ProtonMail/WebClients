import { createElement } from '@proton/pass/utils/dom';

import type { ProtonPassRoot } from '../custom-elements/ProtonPassRoot';

export const getIFrameRoot = () => document.querySelector<ProtonPassRoot>('protonpass-root');
export const isIFrameRootAttached = () => getIFrameRoot() !== null;

export const createIframeRoot = (): ProtonPassRoot => {
    const root = getIFrameRoot();
    if (root !== null) return root;

    const iframeRoot = createElement<ProtonPassRoot>({
        type: 'protonpass-root',
        parent: document.body,
    });

    iframeRoot.style.display = 'none';
    iframeRoot.addEventListener('ready', () => iframeRoot.style.removeProperty('display'), { once: true });

    return iframeRoot;
};
