/* This script should not be loaded in the content-script realm :
 * we need access to the customElements API which is either missing
 * or limited in the content-script execution context */
import 'proton-pass-extension/lib/utils/polyfills';

import { exporter } from './bridge/utils';
import { ProtonPassControl } from './injections/custom-elements/ProtonPassControl';
import { ProtonPassRoot } from './injections/custom-elements/ProtonPassRoot';

/** The `registerPassElements` function is temporarily exposed on the
 * global object to facilitate its invocation from an `executeScript`
 * function within the service worker. This setup enables passing the
 * `PassElementsConfig` to this script operating in the MAIN world */
exporter(
    (hash: string) => {
        /** Handle Polymer.js interference: since we inject at `document_end`,
         * Polymer may have already patched customElements. Get original references
         * through CustomElementRegistry.prototype to bypass interference. */
        const define = CustomElementRegistry.prototype.define.bind(customElements);
        const get = CustomElementRegistry.prototype.get.bind(customElements);

        const root = ProtonPassRoot.getTagName(hash);
        const control = ProtonPassControl.getTagName(hash);
        if (!get(root)) define(root, ProtonPassRoot);
        if (!get(control)) define(control, ProtonPassControl);

        delete window.registerPassElements;
    },
    window,
    { defineAs: 'registerPassElements' }
);
