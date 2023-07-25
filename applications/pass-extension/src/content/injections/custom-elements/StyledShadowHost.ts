export class StyledShadowHost extends HTMLElement {
    constructor(cssStyles: string) {
        super();

        const shadowRoot = this.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('style');
        styleElement.textContent = cssStyles;

        shadowRoot.appendChild(styleElement);
    }
}
