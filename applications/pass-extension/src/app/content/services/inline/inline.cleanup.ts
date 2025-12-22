import { OVERRIDE_STYLES_ATTR } from 'proton-pass-extension/app/content/constants.static';

import type { PassElementsConfig } from '@proton/pass/types/utils/dom';

import { cleanupStyleOverrides } from './icon/icon.utils';

export const DOMCleanUp = ({ root, control }: PassElementsConfig) => {
    /* remove all injected DOM nodes */
    const injectedNodes = document.querySelectorAll(`${root}, ${control}`);
    injectedNodes.forEach((node) => node.remove());

    /* reset input field styles */
    const els = document.querySelectorAll<HTMLInputElement>(`[${OVERRIDE_STYLES_ATTR}]`);
    els.forEach((el) => cleanupStyleOverrides(el));
};
