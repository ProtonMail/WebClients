import { TidyURL } from 'tidy-url';

import { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

export const getUTMTrackersFromURL = (originalURL: string) => {
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
};
