/* This script should not be loaded in the content-script realm :
 * we need access to the customElements API which is either missing
 * or limited in the content-script execution context */
import { ProtonPassControl } from './injections/custom-elements/ProtonPassControl';
import { ProtonPassRoot } from './injections/custom-elements/ProtonPassRoot';

export const createCustomElements = () => {
    if (!customElements.get('protonpass-root')) customElements.define('protonpass-root', ProtonPassRoot);
    if (!customElements.get('protonpass-control')) customElements.define('protonpass-control', ProtonPassControl);
};

createCustomElements();
