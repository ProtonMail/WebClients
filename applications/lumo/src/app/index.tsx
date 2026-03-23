import React from 'react';
import ReactDOM from 'react-dom/client';

import '@proton/polyfill';

// requestIdleCallback is not available in older WebKit engines (e.g. Orion, Safari < 17).
// Some vendor bundles call it without a guard, so polyfill before anything else runs.
if (typeof window.requestIdleCallback === 'undefined') {
    window.requestIdleCallback = (cb, options) => {
        const start = Date.now();
        return window.setTimeout(() => {
            cb({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
            });
        }, options?.timeout ?? 1) as unknown as number;
    };
    window.cancelIdleCallback = (id) => window.clearTimeout(id);
}

// Element.prototype.matches can be absent or restricted in Orion (WebKit) due to its
// fingerprinting-protection features. The tabbable focus-trap library initialises
// `matches` once at module-load time and will throw "undefined is not an object
// (evaluating 'matches.call')" for every Tab keypress inside a modal when this
// happens. Polyfill via querySelectorAll before any other module is evaluated.
if (typeof Element !== 'undefined' && !Element.prototype.matches) {
    Element.prototype.matches = function (this: Element, selector: string): boolean {
        const root = this.ownerDocument;
        if (!root) {
            return false;
        }
        const nodes = root.querySelectorAll(selector);
        let i = nodes.length;
        while (--i >= 0 && nodes.item(i) !== this) {}
        return i > -1;
    };
}

import AppGuard from './entrypoint/AppGuard';

// import MSWController from './mocks/MSWController';

import './index.scss';

ReactDOM.createRoot(document.querySelector('.app-root')!).render(
    <React.StrictMode>
        <>
            <AppGuard />

            {/* MSWController is only visible in development */}
            {/* <MSWController /> */}
        </>
    </React.StrictMode>
);
