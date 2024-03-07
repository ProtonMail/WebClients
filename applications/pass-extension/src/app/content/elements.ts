/* This script should not be loaded in the content-script realm :
 * we need access to the customElements API which is either missing
 * or limited in the content-script execution context */
import { ProtonPassControl } from './injections/custom-elements/ProtonPassControl';
import { ProtonPassRoot } from './injections/custom-elements/ProtonPassRoot';

/** The `registerPassElements` function is temporarily exposed on the
 * global object to facilitate its invocation from an `executeScript`
 * function within the service worker. This setup enables passing the
 * `PassElementsConfig` to this script operating in the MAIN world */
window.registerPassElements = (config) => {
    const { root, control } = config;
    if (!customElements.get(root)) customElements.define(root, ProtonPassRoot);
    if (!customElements.get(control)) customElements.define(control, ProtonPassControl);
    delete window.registerPassElements;
};
