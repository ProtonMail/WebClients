export class StyledShadowHost extends HTMLElement {
    constructor(styles: string) {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });

        /** Utilize CSSStyleSheet API to circumvent CSP restrictions
         * on inline styles that could exist in target websites  */
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        shadowRoot.adoptedStyleSheets.push(sheet);
    }
}
