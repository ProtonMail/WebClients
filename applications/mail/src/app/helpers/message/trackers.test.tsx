import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
import type { MessageImage, MessageImages, MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import type { Tracker } from '../../hooks/message/useMessageTrackers';
import { getImageTrackersFromMessage, getUTMTrackersFromMessage } from './trackers';

const tracker1Url = 'http://tracker.com';
const tracker2Url = 'http://tracking.com';
const tracker3Url = 'http://trackerInBlockQuote.com';
const tracker4Url = 'http://Tracker.com';

const utmTracker1 = 'http://tracker.com?utm_source=tracker';
const utmTracker2 = 'http://tracking.com?utm_source=tracking&utm_content=tracking';

const document = `
<div>
    <div>
        Here is some mail content
        <img src="${tracker1Url}" alt="" data-proton-remote="1"/>
        <img src="${tracker1Url}" alt="" data-proton-remote="2"/>
        <img src="${tracker2Url}" alt="" data-proton-remote="3"/>
        <img src="${tracker4Url}" alt="" data-proton-remote="5"/>
    </div>

    <blockquote class="protonmail_quote" type="cite">
        Here is some blockquote content
        <img src="${tracker3Url}" alt="" data-proton-remote="4"/>
    </blockquote>
</div>`;

const message = {
    messageImages: {
        images: [
            {
                type: 'remote',
                id: '1',
                originalURL: `${tracker1Url}/tracker-1`,
                url: `${tracker1Url}/tracker-1`,
                tracker: tracker1Url,
            },
            {
                type: 'remote',
                id: '2',
                originalURL: `${tracker1Url}/tracker-2`,
                url: `${tracker1Url}/tracker-2`,
                tracker: tracker1Url,
            },
            {
                type: 'embedded',
                id: '3',
                cloc: `${tracker2Url}/tracker`,
                tracker: tracker2Url,
            },
        ] as MessageImage[],
    } as MessageImages,
    messageDocument: {
        document: parseDOMStringToBodyElement(document),
    },
    messageUTMTrackers: [
        {
            originalURL: utmTracker1,
            cleanedURL: tracker1Url,
            removed: [{ key: 'utm_source', value: 'tracker' }],
        },
        {
            originalURL: utmTracker2,
            cleanedURL: tracker2Url,
            removed: [
                { key: 'utm_source', value: 'tracking' },
                { key: 'utm_content', value: 'tracking' },
            ],
        },
    ] as MessageUTMTracker[],
} as MessageState;

describe('trackers', () => {
    describe('getImageTrackersFromMessage', () => {
        it('should return the expected image trackers', () => {
            const { trackers, numberOfTrackers } = getImageTrackersFromMessage(message);

            const expectedTrackers: Tracker[] = [
                { name: tracker1Url, urls: [`${tracker1Url}/tracker-1`, `${tracker1Url}/tracker-2`] },
                { name: tracker2Url, urls: [`${tracker2Url}/tracker`] },
            ];

            expect(trackers).toEqual(expectedTrackers);
            expect(numberOfTrackers).toEqual(3);
        });
    });

    describe('getImageTrackersFromMessage', () => {
        it('should return expected utm trackers', () => {
            const { trackers, numberOfTrackers } = getUTMTrackersFromMessage(message);

            const expectedTrackers = [
                {
                    originalURL: utmTracker1,
                    cleanedURL: tracker1Url,
                    removed: [{ key: 'utm_source', value: 'tracker' }],
                },
                {
                    originalURL: utmTracker2,
                    cleanedURL: tracker2Url,
                    removed: [
                        { key: 'utm_source', value: 'tracking' },
                        { key: 'utm_content', value: 'tracking' },
                    ],
                },
            ];

            expect(trackers).toEqual(expectedTrackers);
            expect(numberOfTrackers).toEqual(2);
        });
    });
});
