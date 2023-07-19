import { TidyURL } from '@protontech/tidy-url';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

export const getUTMTrackersFromURL = (originalURL: string) => {
    // originalURL can be an mailto: link
    try {
        // Only parse http(s) URLs
        try {
            // new URL(originalURL) may crash if the URL is invalid on Safari
            const { protocol } = new URL(originalURL);

            if (!protocol.includes('http')) {
                return undefined;
            }
        } catch {
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
