import { TidyURL } from '@protontech/tidy-url';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

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

        /**
         * Allow amp links. By default, they are being cleaned but too many links were broken.
         * For example:
         * - https://something.me/L0/https:%2F%2Fsomething-else.amazonaws.com%randomID
         * Was cleaned to:
         * - https://something-else.amazonaws.com/randomID
         * Which was not working as expected when being opened.
         */
        TidyURL.config.allowAMP = true;

        const { url, info } = TidyURL.clean(originalURL);
        /*
         If we found removed elements or there is a difference between original link and cleaned link,
         we have a tracker that we need to display in the privacy dropdown.
         The original URL might also contain uppercase letters in the first part of the URL that will be updated by the library
         e.g. https://Proton.me would become https://proton.me, and we don't want it to be detected as a tracker
         */
        if (originalURL.toLowerCase() !== url.toLowerCase()) {
            const utmTracker: MessageUTMTracker = {
                originalURL,
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
