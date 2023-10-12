export class StyledShadowHost extends HTMLElement {
    static publicPath: string;

    constructor(href: string) {
        super();

        const shadowRoot = this.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('link');
        const readyEvent = new Event('ready', { bubbles: true, composed: true });

        styleElement.setAttribute('rel', 'stylesheet');
        styleElement.setAttribute('href', `${StyledShadowHost.publicPath}${href}`);
        styleElement.addEventListener('load', () => this.dispatchEvent(readyEvent), { once: true });

        shadowRoot.appendChild(styleElement);
    }
}
