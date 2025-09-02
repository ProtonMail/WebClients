import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import ProtonPassRootStyles from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot.raw.scss';

import { createCustomElement } from '@proton/pass/utils/dom/create-element';

export const getIFrameRoot = (rootTag: string) => document.querySelector<ProtonPassRoot>(rootTag);
export const isIFrameRootAttached = (rootTag: string) => getIFrameRoot(rootTag) !== null;

export const createIframeRoot = (rootTag: string, target?: HTMLElement) =>
    createCustomElement<ProtonPassRoot>({
        type: rootTag,
        parent: target ?? document.body,
        styles: ProtonPassRootStyles,
    });
