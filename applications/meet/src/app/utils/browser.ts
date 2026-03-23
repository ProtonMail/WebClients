import { isFirefox, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

export const supportsSetSinkId = () => {
    if (!document || isSafari() || isMobile() || isFirefox()) {
        return false;
    }

    return 'setSinkId' in document.createElement('audio');
};
