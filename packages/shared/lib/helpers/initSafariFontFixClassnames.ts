export const initSafariFontFixClassnames = () => {
    const userAgent = navigator.userAgent;
    if (
        userAgent.indexOf('Safari') != -1 &&
        userAgent.indexOf('Chrome') == -1 &&
        (userAgent.match(/Version\/16\.[0123]/) || userAgent.match(/iPhone OS 16_[0123]/))
    ) {
        document.body.classList.add('isSafari16');
    }
};
