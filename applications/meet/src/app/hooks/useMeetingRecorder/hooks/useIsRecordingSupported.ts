import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';

export const useIsRecordingSupported = () => {
    return !isFirefox() && !isMobile();
};
