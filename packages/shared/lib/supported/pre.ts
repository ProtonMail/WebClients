import { SupportedBrowserValue } from './interface';

const scriptNode =
    // The tag that we're interested in is the main script file. Normally that's index.js.
    document.querySelector<HTMLScriptElement>('script[src*="/index"]') ||
    // but there's also lite, eo, private, and public script files. So we suffix them with -index.
    document.querySelector<HTMLScriptElement>('script[src*="-index"]');

if (scriptNode) {
    scriptNode.onerror = () => {
        window.protonSupportedBrowser = SupportedBrowserValue.Other;
    };
    scriptNode.onload = () => {
        if (window.protonSupportedBrowser === undefined) {
            window.protonSupportedBrowser = SupportedBrowserValue.Unsupported;
        }
    };
}
