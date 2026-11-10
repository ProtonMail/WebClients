import config from '../app/config';

type BackButtonInvoker = {
    getLabel: () => Promise<string>;
    goBack: () => void;
};

const BUTTON_ID = 'pass-desktop-back-button';

/** `-webkit-app-region` ignores z-index: `no-drag` keeps the button
 * clickable when Account renders a drag region under it (macOS title bar). */
const BUTTON_STYLE = `
#${BUTTON_ID} {
    -webkit-app-region: no-drag;
    position: fixed;
    top: 1rem;
    inset-inline-end: 1rem;
    z-index: 2147483647;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
    opacity: 0.7;
    cursor: pointer;
}
#${BUTTON_ID}:hover {
    opacity: 1;
    background: rgb(128 128 128 / 0.2);
}
`;

/** Account has no way back to the app, and its pages load in the main
 * frame: the preload adds a fixed Back button there, outside Account's root. */
export const setupAccountBackButton = ({ getLabel, goBack }: BackButtonInvoker) => {
    if (location.origin !== new URL(config.SSO_URL).origin) return;

    window.addEventListener('DOMContentLoaded', async () => {
        const style = document.createElement('style');
        style.textContent = BUTTON_STYLE;

        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.type = 'button';
        button.textContent = `‹ ${await getLabel()}`;
        button.addEventListener('click', goBack);

        document.head.append(style);
        document.body.append(button);
    });
};
