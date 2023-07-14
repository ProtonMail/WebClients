import { TidyURL } from '@protontech/tidy-url';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

export const getUTMTrackersFromURL = (originalURL: string) => {
    try {
        /*
         * Check that the URL is valid before cleaning the URL
         * We also surround this method with an extra try&catch in case of lib crash
         */
        const { protocol } = new URL(originalURL);

        if (!protocol.includes('http')) {
            return undefined;
        }

        const { url, info } = TidyURL.clean(originalURL);

        let utmTracker: MessageUTMTracker | undefined;
        if (info.removed.length > 0) {
            utmTracker = {
                originalURL: info.original,
                cleanedURL: url,
                removed: info.removed,
            };
        }

        return { url, info, utmTracker };
    } catch {
        captureMessage('Failed to parse URL with trackers');
        return undefined;
    }
};
