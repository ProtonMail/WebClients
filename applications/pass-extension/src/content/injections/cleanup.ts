import { EXTENSION_PREFIX, INPUT_STYLES_ATTR, PROCESSED_FIELD_ATTR, PROCESSED_FORM_ATTR } from '../constants';
import { cleanupInputInjectedStyles } from './icon';
import { getIFrameRoot } from './iframe/create-iframe-root';

export const DOMCleanUp = () =>
    requestAnimationFrame(() => {
        /* remove all injected iframes */
        const root = getIFrameRoot();
        root?.parentElement?.removeChild(root);

        /* remove all injected DOM nodes */
        const injectedNodes = document.querySelectorAll(`[class^='${EXTENSION_PREFIX}-']`);
        injectedNodes.forEach((node) => node.remove());

        /* reset input field styles */
        const inputs = document.querySelectorAll<HTMLInputElement>(`input[${INPUT_STYLES_ATTR}]`);
        inputs.forEach((input) => cleanupInputInjectedStyles(input));

        /* remove extension attributes */
        [PROCESSED_FIELD_ATTR, PROCESSED_FORM_ATTR].forEach((attr) => {
            document.querySelectorAll(`[${attr}]`).forEach((node) => node.removeAttribute(attr));
        });
    });
