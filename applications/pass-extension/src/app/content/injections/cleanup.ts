import { INPUT_BASE_STYLES_ATTR } from '../constants.static';
import { cleanupInputInjectedStyles } from './icon';

export const DOMCleanUp = () => {
    /* remove all injected DOM nodes */
    const injectedNodes = document.querySelectorAll('protonpass-control, protonpass-root');
    injectedNodes.forEach((node) => node.remove());

    /* reset input field styles */
    const inputs = document.querySelectorAll<HTMLInputElement>(`input[${INPUT_BASE_STYLES_ATTR}]`);
    inputs.forEach((input) => cleanupInputInjectedStyles(input));
};
