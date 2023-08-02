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

        /*
         If we found removed elements or there is a difference between original link and cleaned link,
         we have a tracker that we need to display in the privacy dropdown
         */
        if (originalURL !== url) {
            const utmTracker: MessageUTMTracker = {
                originalURL: info.original,
                cleanedURL: url,
                removed: info.removed,
            };

            return { url, info, utmTracker };
        }

        return { url: originalURL, info, utmTracker: undefined };
    } catch {
        captureMessage('Failed to parse URL with trackers');
        return undefined;
    }
};
