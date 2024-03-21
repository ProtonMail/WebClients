import { StyledShadowHost } from './StyledShadowHost';

// @ts-ignore
import styles from './ProtonPassControl.raw.scss';

export class ProtonPassControl extends StyledShadowHost {
    static getTagName = (hash: string) => `protonpass-control-${hash}`;

    constructor() {
        super(styles);
    }

    connectedCallback() {
        this.setAttribute('data-protonpass-role', 'icon');
    }
}
