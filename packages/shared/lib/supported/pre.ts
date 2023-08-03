import { SupportedBrowserValue } from './interface';

const preScriptNode = document.querySelector<HTMLScriptElement>('script[src*="/pre"]');
// The tag that we're interested in is the main script file. Normally that's index.js but there's also lite and eo take
// into account and we fallback to the nextSibling in those scenarios since pre.js is supposed to be first.
const scriptNode =
    document.querySelector<HTMLScriptElement>('script[src*="/index"]') ||
    (preScriptNode?.nextSibling as HTMLScriptElement);

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
