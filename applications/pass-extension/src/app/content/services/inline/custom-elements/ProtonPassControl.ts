import { PASS_ELEMENT_ROLE, ProtonPassElement } from './ProtonPassElement';

export const getControlTagName = (hash: string) => `protonpass-control-${hash}`;

export class ProtonPassControl extends ProtonPassElement {
    static getTagName = getControlTagName;

    connectedCallback() {
        super.connectedCallback();
        this.setAttribute(PASS_ELEMENT_ROLE, 'icon');
    }
}
