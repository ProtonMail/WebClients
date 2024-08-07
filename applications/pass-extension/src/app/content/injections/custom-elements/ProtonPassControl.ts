import { PASS_ELEMENT_ROLE, ProtonPassElement } from './ProtonPassElement';

// @ts-ignore
import styles from './ProtonPassControl.raw.scss';

export class ProtonPassControl extends ProtonPassElement {
    static getTagName = (hash: string) => `protonpass-control-${hash}`;

    constructor() {
        super(styles);
    }

    connectedCallback() {
        super.connectedCallback();
        this.setAttribute(PASS_ELEMENT_ROLE, 'icon');
    }
}
