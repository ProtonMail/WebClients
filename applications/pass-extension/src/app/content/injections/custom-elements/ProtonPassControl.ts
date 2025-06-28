import { PASS_ELEMENT_ROLE, ProtonPassElement } from './ProtonPassElement';

export class ProtonPassControl extends ProtonPassElement {
    static getTagName = (hash: string) => `protonpass-control-${hash}`;

    connectedCallback() {
        super.connectedCallback();
        this.setAttribute(PASS_ELEMENT_ROLE, 'icon');
    }
}
