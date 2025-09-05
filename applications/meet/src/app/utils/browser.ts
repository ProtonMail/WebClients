import { isSafari } from '@proton/shared/lib/helpers/browser';

export const supportsSetSinkId = () => {
    if (!document || isSafari()) {
        return false;
    }

    return 'setSinkId' in document.createElement('audio');
};
