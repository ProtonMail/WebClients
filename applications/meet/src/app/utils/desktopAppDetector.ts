export const tryOpenInDesktopApp = (meetingUrl: string): void => {
    try {
        const url = new URL(meetingUrl);
        const protocolUrl = `proton-meet://${url.host}${url.pathname}${url.search}${url.hash}`;

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = protocolUrl;
        document.body.appendChild(iframe);

        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 100);
    } catch {
        // Invalid URL - silently fail
    }
};
