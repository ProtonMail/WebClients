// eslint-disable-next-line import/no-unresolved
import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';
import unsupportedBrowser from '@proton/styles/assets/img/errors/unsupported-browser.svg';

import { SupportedBrowserValue } from './interface';

const showUnsupported = () => {
    const isProtonVPN = (document.location.origin || document.location.href).indexOf('protonvpn') !== -1;
    const hostname = document.location.hostname;
    const kbUrl = isProtonVPN
        ? 'https://protonvpn.com/support/browsers-supported/'
        : `https://${hostname.slice(hostname.indexOf('.') + 1)}/support/recommended-browsers`;
    // Not using getKnowledgeBaseUrl( to minimize the bundle size since it apparently doesn't tree-shake the bundle correctly and adds an extra 40k

    document.body.innerHTML = `
        <div class='h100 flex flex-align-items-center pb4 scroll-if-needed'>
            <div class='mauto text-center max-w30e'>
                <h1 class='text-bold text-4xl'>Unsupported browser</h1>
                <p>
                    You are using an unsupported browser. Please update it to the latest version or use a different browser.
                </p>
                <a class='primary-link bold' target='_blank' rel='noopener noreferrer' href='${kbUrl}'>More info</a>
                <div class='mt2'>
                    <img src='${unsupportedBrowser}' alt='Unsupported browser'/>
                </div>
            </div>
        </div>
    `;

    document.title = 'Unsupported browser';
};

const showError = () => {
    document.body.innerHTML = `
        <div class='h100 flex flex-align-items-center pb4 scroll-if-needed'>
            <div class='mauto text-center max-w30e'>
                <div class='mb2'>
                    <img src='${errorImg}' alt='Error'/>
                </div>
                <h1 class='text-bold text-4xl'>Oops, something went wrong</h1>
                <p>
                    Please <button id='refresh' class='link align-baseline'>refresh the page</button> or try again later.
                </p>
            </div>
        </div>
    `;

    document.querySelector<HTMLButtonElement>('#refresh')?.addEventListener('click', () => {
        window.location.reload();
    });

    document.title = 'Oops, something went wrong';
};

const run = () => {
    if (window.protonSupportedBrowser === SupportedBrowserValue.Unsupported) {
        showUnsupported();
        /*
         * undefined equality is also checked because the `onerror` handler is called immediately on failures in firefox, and not
         * after execution has started like it does on webkit. so if the index.js file fails before the pre.js file has
         * gotten parsed, the handler never triggers. so it assumes that undefined means network failure. the `onload` behavior seems
         * different and is executed in order, so parsing failures should always happen through the onload handler (in pre.js)
         * which would set it to 0.
         */
    } else if (
        window.protonSupportedBrowser === SupportedBrowserValue.Other ||
        window.protonSupportedBrowser === undefined
    ) {
        showError();
    }
};

// In a timeout to avoid race conditions with the onerror handler
window.setTimeout(run, 33);
