import UAParser from 'ua-parser-js';

const uaParser = new UAParser();
const ua = uaParser.getResult();

export const hasModulesSupport = () => {
    const script = document.createElement('script');
    return 'noModule' in script;
};

export const isFileSaverSupported = () => !!new Blob();

export const textToClipboard = (text = '', target = document.body) => {
    const oldActiveElement = document.activeElement as HTMLElement;
    if (navigator.clipboard) {
        void navigator.clipboard.writeText(text);
    } else {
        const dummy = document.createElement('textarea');
        target.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand('copy');
        target.removeChild(dummy);
    }
    oldActiveElement?.focus?.();
};

export const copyDomToClipboard = async (element: HTMLElement) => {
    if (!element || !(element instanceof HTMLElement)) {
        console.error('Invalid element provided');
        return;
    }

    // Try to use the Clipboard API if available
    if (navigator.clipboard && typeof navigator.clipboard.write === 'function') {
        const type = 'text/html';
        const blob = new Blob([element.innerHTML], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        await navigator.clipboard.write(data);
    } else {
        const activeElement = document.activeElement;

        // Create an off-screen container for the element's HTML content
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.innerHTML = element.innerHTML;

        document.body.appendChild(tempContainer);

        const selection = window.getSelection();
        if (!selection) {
            console.error('Failed to get selection');
            document.body.removeChild(tempContainer);
            return;
        }

        // Select the contents of the temporary container
        const range = document.createRange();
        range.selectNodeContents(tempContainer);

        selection.removeAllRanges();
        selection.addRange(range);

        // Copy the selected content to the clipboard
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Failed to copy content', err);
        }

        // Clean up
        document.body.removeChild(tempContainer);
        selection.removeAllRanges();

        // Restore previous focus
        if (activeElement instanceof HTMLElement) {
            activeElement.focus();
        }
    }
};

export const getOS = () => {
    const { name = 'other', version = '' } = ua.os;
    return { name, version };
};

export const isIos11 = () => {
    const { name, version } = getOS();
    return name.toLowerCase() === 'ios' && parseInt(version, 10) === 11;
};

export const isAndroid = () => {
    const { name } = getOS();
    return name.toLowerCase().includes('android');
};

export const isSafari = () => ua.browser.name === 'Safari' || ua.browser.name === 'Mobile Safari';
export const isSafari11 = () => isSafari() && ua.browser.major === '11';
export const isMinimumSafariVersion = (version: number) => isSafari() && Number(ua.browser.version) >= version;
export const isSafariMobile = () => ua.browser.name === 'Mobile Safari';
export const isIE11 = () => ua.browser.name === 'IE' && ua.browser.major === '11';
export const isEdge = () => ua.browser.name === 'Edge';
export const isEdgeChromium = () => isEdge() && ua.engine.name === 'Blink';
export const isBrave = () => ua.browser.name === 'Brave';
export const isFirefox = () => ua.browser.name === 'Firefox';
export const isMaybeTorLessThan11 = () => {
    const isMaybeTor =
        isFirefox() &&
        /\.0$/.test(ua.browser.version || '') && // The Firefox minor revision is omitted.
        Intl.DateTimeFormat().resolvedOptions().timeZone === 'UTC' && // The timezone is set to UTC
        !Object.prototype.hasOwnProperty.call(window, 'Components') && // It strips out Components
        navigator.plugins.length === 0; // 0 plugins are returned
    // Starting from tor browser 11, tor is based on firefox 91
    return isMaybeTor && !!ua.browser.major && +ua.browser.major < 91;
};
export const isChrome = () => ua.browser.name === 'Chrome';
export const isChromiumBased = () => 'chrome' in window;
export const isJSDom = () => navigator.userAgent.includes('jsdom');
export const isMac = () => ua.os.name === 'Mac OS';
export const isWindows = () => ua.os.name === 'Windows';
export const isLinux = () => ua.ua.match(/(L|l)inux/);
export const hasTouch = typeof document === 'undefined' ? false : 'ontouchstart' in document.documentElement;
export const hasCookie = () => navigator.cookieEnabled;
export const getBrowser = () => ua.browser;
export const getDevice = () => ua.device;
export const isMobile = () => {
    const { type } = getDevice();
    return type === 'mobile';
};
export const isDesktop = () => {
    const { type } = getDevice();
    return !type;
};
export const getIsIframe = () => window.self !== window.top;

export const metaKey = isMac() ? '⌘' : 'Ctrl';
export const altKey = isMac() ? 'Option' : 'Alt';
export const shiftKey = 'Shift';

export const getActiveXObject = (name: string) => {
    try {
        // @ts-ignore
        return new ActiveXObject(name);
    } catch (error: any) {
        return undefined;
    }
};

export const isIos = () =>
    // https://racase.com.np/javascript-how-to-detect-if-device-is-ios/
    (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) ||
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
export const isIpad = () => isSafari() && navigator.maxTouchPoints && navigator.maxTouchPoints > 2;
export const hasAcrobatInstalled = () => !!(getActiveXObject('AcroPDF.PDF') || getActiveXObject('PDF.PdfCtrl'));
export const hasPDFSupport = () => {
    // mimeTypes is deprecated in favor of pdfViewerEnabled.
    return (
        (navigator.mimeTypes && 'application/pdf' in navigator.mimeTypes) ||
        navigator.pdfViewerEnabled ||
        (isFirefox() && isDesktop()) ||
        isIos() ||
        hasAcrobatInstalled()
    );
};
export const replaceUrl = (url = '') => document.location.replace(url);
export const redirectTo = (url = '') => replaceUrl(`${document.location.origin}${url}`);

/**
 * Detect browser requiring direct action
 * Like opening a new tab
 */
export const requireDirectAction = () => isSafari() || isFirefox() || isEdge();

/**
 * Open an URL inside a new tab/window and remove the referrer
 * @links { https://mathiasbynens.github.io/rel-noopener/}
 */
export const openNewTab = (url: string) => {
    if (isIE11()) {
        const otherWindow = window.open();
        if (!otherWindow) {
            return;
        }
        otherWindow.opener = null;
        otherWindow.location.href = url;
        return;
    }
    const anchor = document.createElement('a');

    anchor.setAttribute('rel', 'noreferrer nofollow noopener');
    anchor.setAttribute('target', '_blank');
    anchor.href = url;

    return anchor.click();
};

// On safari < 14 the Version cookie is sent for index.html file but
// not sent for asset requests due to https://bugs.webkit.org/show_bug.cgi?id=171566
export const doesNotSupportEarlyAccessVersion = () => isSafari() && Number(ua.browser.major) < 14;

export const getHasWebAuthnSupport = () => {
    try {
        return !!navigator?.credentials?.create;
    } catch (e) {
        return false;
    }
};

export const browserAPI = (globalThis as any)?.browser ?? (globalThis as any)?.chrome;
