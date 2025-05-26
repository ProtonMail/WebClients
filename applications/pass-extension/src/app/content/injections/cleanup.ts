import { INPUT_BASE_STYLES_ATTR } from 'proton-pass-extension/app/content/constants.static';

import type { PassElementsConfig } from '@proton/pass/types/utils/dom';

import { cleanupInputInjectedStyles } from './icon/utils';

export const DOMCleanUp = ({ root, control }: PassElementsConfig) => {
    /* remove all injected DOM nodes */
    const injectedNodes = document.querySelectorAll(`${root}, ${control}`);
    injectedNodes.forEach((node) => node.remove());

    /* reset input field styles */
    const inputs = document.querySelectorAll<HTMLInputElement>(`input[${INPUT_BASE_STYLES_ATTR}]`);
    inputs.forEach((input) => cleanupInputInjectedStyles(input));
};
