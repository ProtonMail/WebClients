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

            const result = getUTMTrackersFromURL(originalURL);

            expect(result!.url).toEqual(cleanedURL);
            expect(result!.utmTracker).toEqual(expectedUTMTracker);
        });

        it('should not clean utm trackers', () => {
            const originalURL = 'https://ads.com?whatever=something';

            const result = getUTMTrackersFromURL(originalURL);

            expect(result!.url).toEqual(originalURL);
            expect(result!.utmTracker).toEqual(undefined);
        });

        it('should clean all links as expected', () => {
            links.map((link) => {
                const result = getUTMTrackersFromURL(link.originalLink);
                expect(result!.url).toEqual(link.cleanedLink);
            });
        });

        it('should return undefined when it throws or URL is not valid', () => {
            expect(getUTMTrackersFromURL(`<html>dude <a href="dude sd;lkfjads;lkfj !+@#%$^&*()"<html>`)).toBe(
                undefined
            );
        });
    });
});
