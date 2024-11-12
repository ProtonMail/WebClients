import type { MaybeNull } from '@proton/pass/types';

export const PASS_ELEMENT_ROLE = 'data-protonpass-role';
export const PASS_ELEMENT_THEME = 'data-protonpass-theme';

const ALLOWED_ATTRS = [PASS_ELEMENT_ROLE, PASS_ELEMENT_THEME, 'aria-hidden'];
const MAX_ATTR_REMOVAL_ATTEMPTS = 25;

export class ProtonPassElement extends HTMLElement {
    private mutationObs: MaybeNull<MutationObserver> = null;

    private attrsMutationCount: Map<string, number> = new Map();

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
                if (type === 'attributes' && attributeName && !ALLOWED_ATTRS.includes(attributeName)) {
                    const mutationCount = this.attrsMutationCount.get(attributeName) ?? 0;
                    this.attrsMutationCount.set(attributeName, mutationCount + 1);
                    this.removeAttribute(attributeName);

                    /** Some websites use analytics or trackers that set up their own
                     * mutation observers (e.g PayPal's modal focus handling or the
                     * ShortPixel Adapative Image plugin). These can create infinite
                     * loops because of a mutation observer conflict.
                     * After `MAX_ATTR_REMOVAL_ATTEMPTS`, we stop fighting and allow the
                     * attribute to prevent observer deadlocks and performance issues */
                    if (mutationCount > MAX_ATTR_REMOVAL_ATTEMPTS) {
                        ALLOWED_ATTRS.push(attributeName);
                        this.attrsMutationCount.delete(attributeName);
                    }
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
