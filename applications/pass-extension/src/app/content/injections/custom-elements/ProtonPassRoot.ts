import { PASS_ROOT_REMOVED_EVENT } from 'proton-pass-extension/app/content/constants.static';

import { PASS_ELEMENT_ROLE, ProtonPassElement } from './ProtonPassElement';

export class ProtonPassRoot extends ProtonPassElement {
    static getTagName = (hash: string) => `protonpass-root-${hash}`;

    disconnectedCallback() {
        super.disconnectedCallback();
        /* When the `ProtonPassRoot` custom element is removed, it triggers
         * re-injection via the IFrameService. This ensures proper support for
         * SPA websites that may dynamically rewrite the DOM. To handle potential
         * cleanup sequences, such as those seen on sites like docusign.com,
         * this element dispatches the root removal event using an idle callback
         * to prevent performance bottlenecks. */
        requestIdleCallback(() => {
            const event = new CustomEvent(PASS_ROOT_REMOVED_EVENT, { bubbles: true });
            this.dispatchEvent(event);
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this.setAttribute(PASS_ELEMENT_ROLE, 'root');
    }
}
