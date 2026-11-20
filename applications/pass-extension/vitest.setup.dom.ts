import '@testing-library/jest-dom/vitest';
import '@proton/components/testing/vitest/mockMatchMedia';

/** Our CSS reset shows a <dialog> without `open`, tests do not load it */
const style = document.createElement('style');
style.textContent = 'dialog { display: block; }';
document.head.append(style);

/** The DOM environment rejects the `/` `targetOrigin` the extension uses: always post to `*` */
const originalPostMessage = window.postMessage.bind(window);
window.postMessage = (message: any, _?: any, transferable?: Transferable[]) =>
    originalPostMessage(message, '*', transferable as any);

/** happy-dom's fetch goes through `node:http`, where MSW lets unhandled requests reach the real network
 * (its `onUnhandledRequest: 'error'` only blocks them for Node's fetch). MSW wraps this function when it
 * listens: whatever reaches it was not mocked, and fails as it would offline. */
globalThis.fetch = () => Promise.reject(new TypeError('Network request not mocked'));
