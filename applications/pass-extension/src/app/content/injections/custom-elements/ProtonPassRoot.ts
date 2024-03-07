import { PASS_ROOT_REMOVED_EVENT } from 'proton-pass-extension/app/content/constants.static';

import { StyledShadowHost } from './StyledShadowHost';

// @ts-ignore
import styles from './ProtonPassRoot.raw.scss';

export class ProtonPassRoot extends StyledShadowHost {
    constructor() {
        super(styles);
    }

    disconnectedCallback() {
        const event = new CustomEvent(PASS_ROOT_REMOVED_EVENT, { bubbles: true });
        this.dispatchEvent(event);
    }

    connectedCallback() {
        this.setAttribute('data-protonpass-role', 'root');
    }
}
