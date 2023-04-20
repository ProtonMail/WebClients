import { EXTENSION_PREFIX, INPUT_STYLES_ATTR } from '../constants';
import { cleanupInputInjectedStyles } from './icon';
import { getIFrameRoot } from './iframe/create-iframe-root';

export const DOMCleanUp = () => {
    /* remove all injected iframes */
    const root = getIFrameRoot();
    root?.parentElement?.removeChild(root);

    /* remove all injected DOM nodes */
    const injectedNodes = document.querySelectorAll<HTMLElement>(`[class^='${EXTENSION_PREFIX}-']`);
    injectedNodes.forEach((node) => node.remove());

    /* reset input field styles */
    const inputs = document.querySelectorAll<HTMLInputElement>(`input[${INPUT_STYLES_ATTR}]`);
    inputs.forEach((input) => cleanupInputInjectedStyles(input));
};
