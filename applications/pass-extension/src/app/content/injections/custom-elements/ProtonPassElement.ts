import type { MaybeNull } from '@proton/pass/types';

export const PASS_ELEMENT_ROLE = 'data-protonpass-role';

export class ProtonPassElement extends HTMLElement {
    private mutationObs: MaybeNull<MutationObserver> = null;

    constructor(styles: string) {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });

        /** Utilize CSSStyleSheet API to circumvent CSP restrictions
         * on inline styles that could exist in target websites  */
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        shadowRoot.adoptedStyleSheets.push(sheet);
    }

    connectedCallback() {
        /** Avoid websites tampering with our custom elements attributes.
         * IE: paypal adding `data-focus-on-hidden` when opening a modal */
        this.mutationObs = new MutationObserver((mutationList) => {
            for (const { type, attributeName } of mutationList) {
                if (type === 'attributes' && attributeName && attributeName !== PASS_ELEMENT_ROLE) {
                    this.removeAttribute(attributeName);
                }
            }
        });

        /** Observe only attribute mutations on the top-level custom element. */
        this.mutationObs.observe(this, { attributes: true, childList: false });
    }

    disconnectedCallback() {
        this.mutationObs?.disconnect();
    }
}
