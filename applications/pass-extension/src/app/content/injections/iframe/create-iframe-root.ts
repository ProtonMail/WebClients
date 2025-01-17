import { type ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';

import { createElement } from '@proton/pass/utils/dom/create-element';

export const getIFrameRoot = (rootTag: string) => document.querySelector<ProtonPassRoot>(rootTag);
export const isIFrameRootAttached = (rootTag: string) => getIFrameRoot(rootTag) !== null;

export const createIframeRoot = (rootTag: string, target?: HTMLElement) => {
    const root = getIFrameRoot(rootTag);
    if (root) return root;

    const iframeRoot = createElement<ProtonPassRoot>({
        type: rootTag,
        parent: target ?? document.body,
    });

    return iframeRoot;
};
