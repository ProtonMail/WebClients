export const tryOpenInDesktopApp = (meetingUrl: string): void => {
    try {
        const url = new URL(meetingUrl);
        const protocolUrl = `proton-meet://${url.host}${url.pathname}${url.search}${url.hash}`;

        const anchor = document.createElement('a');
        anchor.href = protocolUrl;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();

        setTimeout(() => {
            document.body.removeChild(anchor);
        }, 100);
    } catch {}
};
