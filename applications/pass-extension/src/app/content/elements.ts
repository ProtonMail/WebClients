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
        const root = ProtonPassRoot.getTagName(hash);
        const control = ProtonPassControl.getTagName(hash);
        if (!customElements.get(root)) customElements.define(root, ProtonPassRoot);
        if (!customElements.get(control)) customElements.define(control, ProtonPassControl);
        delete window.registerPassElements;
    },
    window,
    { defineAs: 'registerPassElements' }
);
