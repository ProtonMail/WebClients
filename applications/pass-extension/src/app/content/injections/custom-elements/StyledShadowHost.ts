export class StyledShadowHost extends HTMLElement {
    constructor(styles: string) {
        super();

        const shadowRoot = this.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('style');
        styleElement.innerText = styles;

        shadowRoot.appendChild(styleElement);
    }
}
