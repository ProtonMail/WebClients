import { getUTMTrackersFromURL } from '@proton/shared/lib/mail/trackers';
import { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

// Complete to verify that links are cleaned as expected
const links: { originalLink: string; cleanedLink: string }[] = [
    {
        originalLink: 'https://support.apple.com/fr-fr/HTXXXXXX?cid=email_receipt_itunes_article_HTXXXXXX',
        cleanedLink: 'https://support.apple.com/fr-fr/HTXXXXXX',
    },
];

describe('trackers', () => {
    describe('getUTMTrackersFromURL', () => {
        it('should clean utm trackers', () => {
            const originalURL = 'https://ads.com?utm_source=tracker';
            const cleanedURL = 'https://ads.com/';

            const expectedUTMTracker: MessageUTMTracker = {
                originalURL,
                cleanedURL,
                removed: [{ key: 'utm_source', value: 'tracker' }],
            };

            const { url, utmTracker } = getUTMTrackersFromURL(originalURL);

            expect(url).toEqual(cleanedURL);
            expect(utmTracker).toEqual(expectedUTMTracker);
        });

        it('should not clean utm trackers', () => {
            const originalURL = 'https://ads.com?whatever=something';

            const { url, utmTracker } = getUTMTrackersFromURL(originalURL);

            expect(url).toEqual(originalURL);
            expect(utmTracker).toEqual(undefined);
        });

        it('should clean all links as expected', () => {
            links.map((link) => {
                const { url } = getUTMTrackersFromURL(link.originalLink);
                expect(url).toEqual(link.cleanedLink);
            });
        });
    });
});
