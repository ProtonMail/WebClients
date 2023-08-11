export class StyledShadowHost extends HTMLElement {
    static publicPath: string;

    constructor(href: string) {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('link');
        styleElement.setAttribute('rel', 'stylesheet');
        styleElement.setAttribute('href', `${StyledShadowHost.publicPath}${href}`);

        shadowRoot.appendChild(styleElement);
    }
}
