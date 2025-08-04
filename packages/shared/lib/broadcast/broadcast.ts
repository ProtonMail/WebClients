const getClient = () => {
    const {
        navigator: { standalone, userAgent },
    } = window as any;
    const lowercaseUserAgent = userAgent.toLowerCase();
    const safari = /safari/.test(lowercaseUserAgent);
    const ios = /iphone|ipod|ipad/.test(lowercaseUserAgent);

    if (ios && typeof (window as any)?.webkit?.messageHandlers?.iOS !== 'undefined') {
        if (!standalone && safari) {
            // browser
        } else if (standalone && !safari) {
            // standalone
        } else if (!standalone && !safari) {
            // uiwebview
            return 'ios';
        }
    }

    if (typeof (window as any)?.AndroidInterface !== 'undefined') {
        return 'android';
    }

    if ((window as any).chrome && (window as any).chrome.webview) {
        return 'webview';
    }

    return 'web';
};

const broadcast = <T>(message: T) => {
    const client = getClient();

    const serialized = JSON.stringify(message);

    switch (client) {
        case 'ios': {
            (window as any)?.webkit?.messageHandlers?.iOS?.postMessage?.(serialized);
            break;
        }

        case 'android': {
            (window as any)?.AndroidInterface?.dispatch?.(serialized);
            break;
        }

        case 'webview': {
            // This is an embedded chrome browser. It uses different message passing mechanism.
            // (window as any).chrome.webview.postMessage(message);
            break;
        }

        case 'web': {
            // TODO: Replace with the actual trusted parent origin if different.
            window.parent.postMessage(serialized, 'https://account.proton.me');
            break;
        }

        default:
    }
};

export default broadcast;
