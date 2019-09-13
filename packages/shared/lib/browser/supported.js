import { isIE11 } from '../helpers/browser';

/**
 * This file is included in the main bundle. Its main purpose is to find out if the main bundle could execute,
 * or if it errored out due to a Syntax Error since the main bundle is only compiled against a specific list
 * of browsers. We also check some specific browsers here.
 * The unsupported.js script is included as another script tag and relies on this variable.
 */
const isNotSupported = () => {
    // Whatever other feature detection we want to do.
    return isIE11();
};

window.protonSupportedBrowser = !isNotSupported();
