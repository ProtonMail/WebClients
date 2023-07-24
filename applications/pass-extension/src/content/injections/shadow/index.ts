import '@webcomponents/custom-elements';

import { ProtonPassControl } from './ProtonPassControl';
import { ProtonPassRoot } from './ProtonPassRoot';

customElements.define('protonpass-root', ProtonPassRoot);
customElements.define('protonpass-control', ProtonPassControl);

export type ProtonPassElementTagNameMap = {
    'protonpass-control': ProtonPassControl;
    'protonpass-root': ProtonPassRoot;
};
