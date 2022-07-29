import { fireEvent } from '@testing-library/dom';
import {
    findByText as findByTextDefault,
    getByText as getByTextDefault,
    queryAllByTestId as queryAllByTestIdDefault,
    queryByTestId as queryByTestIdDefault,
} from '@testing-library/react';

import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';

import { setFeatureFlags } from '../../../helpers/test/api';
import { addToCache, minimalCache } from '../../../helpers/test/cache';
import { render } from '../../../helpers/test/render';
import { MessageState } from '../../../logic/messages/messagesTypes';
import ItemSpyTrackerIcon from './ItemSpyTrackerIcon';

const messageWithTrackers: MessageState = {
    localID: 'messageWithTrackerId',
    messageImages: {
        hasEmbeddedImages: true,
        hasRemoteImages: false,
        showEmbeddedImages: true,
        showRemoteImages: true,
        images: [
            {
                type: 'embedded',
                id: 'imageID',
                status: 'loaded',
                tracker: 'Tracker 1',
                cid: 'cid',
                cloc: 'cloc',
                attachment: {},
            },
            {
                type: 'embedded',
                id: 'imageID',
                status: 'loaded',
                tracker: 'Tracker 2',
                cid: 'cid',
                cloc: 'cloc',
                attachment: {},
            },
        ],
    },
};

const messageWithoutTrackers: MessageState = {
    localID: 'messageWithoutTrackerId',
    messageImages: {
        hasEmbeddedImages: true,
        hasRemoteImages: false,
        showEmbeddedImages: true,
        showRemoteImages: true,
        images: [
            {
                type: 'embedded',
                id: 'imageID',
                status: 'loaded',
                tracker: undefined,
                cid: 'cid',
                cloc: 'cloc',
                attachment: {},
            },
        ],
    },
};

describe('ItemSpyTrackerIcon', () => {
    it.each`
        imageProxy                | showImage           | message                   | isIconDisplayed | isNumberDisplayed | expectedTooltip
        ${IMAGE_PROXY_FLAGS.ALL}  | ${SHOW_IMAGES.ALL}  | ${messageWithTrackers}    | ${true}         | ${true}           | ${'2 email trackers blocked'}
        ${IMAGE_PROXY_FLAGS.ALL}  | ${SHOW_IMAGES.ALL}  | ${messageWithoutTrackers} | ${true}         | ${false}          | ${'No email trackers found'}
        ${IMAGE_PROXY_FLAGS.ALL}  | ${SHOW_IMAGES.NONE} | ${messageWithTrackers}    | ${true}         | ${true}           | ${'2 email trackers blocked'}
        ${IMAGE_PROXY_FLAGS.ALL}  | ${SHOW_IMAGES.NONE} | ${messageWithoutTrackers} | ${true}         | ${false}          | ${'No email trackers found'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${SHOW_IMAGES.NONE} | ${messageWithTrackers}    | ${true}         | ${true}           | ${'Email tracker protection is disabled'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${SHOW_IMAGES.NONE} | ${messageWithoutTrackers} | ${true}         | ${false}          | ${'Email tracker protection is disabled'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${SHOW_IMAGES.ALL}  | ${messageWithTrackers}    | ${true}         | ${true}           | ${'2 email trackers blocked'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${SHOW_IMAGES.ALL}  | ${messageWithoutTrackers} | ${false}        | ${false}          | ${''}
    `(
        'should display the icon [$isIconDisplayed] with number [$isNumberDisplayed] and tooltip [$expectedTooltip]',
        async ({ imageProxy, showImage, message, isIconDisplayed, isNumberDisplayed, expectedTooltip }) => {
            minimalCache();
            setFeatureFlags('SpyTrackerProtection', true);
            addToCache('MailSettings', { ImageProxy: imageProxy, ShowImages: showImage });

            const { getByTestId, queryByTestId, getAllByText } = await render(
                <ItemSpyTrackerIcon message={message} />,
                false
            );

            const icon = queryByTestId('privacy:tracker-icon');

            if (!isIconDisplayed) {
                // When icon is not displayed, we don't have a tooltip or the number either
                expect(icon).toBeNull();
            } else {
                // In every other cases, the icon should be displayed
                expect(icon).toBeTruthy();

                // Check that the number of trackers is displayed when we want to display it
                const numberOfTrackers = queryByTestId('privacy:icon-number-of-trackers');
                if (isNumberDisplayed) {
                    expect(numberOfTrackers).toBeTruthy();
                    expect(numberOfTrackers?.innerHTML).toEqual('2');
                } else {
                    expect(numberOfTrackers).toBeNull();
                }

                // Check the text of the Tooltip
                const tooltip = getByTestId('privacy:icon-tooltip');
                fireEvent.mouseOver(tooltip);
                getAllByText(expectedTooltip);
            }
        }
    );

    it('should open a modal with "No email trackers found" title', async () => {
        minimalCache();
        setFeatureFlags('SpyTrackerProtection', true);
        addToCache('MailSettings', { ImageProxy: IMAGE_PROXY_FLAGS.ALL, ShowImages: SHOW_IMAGES.ALL });

        const { findByTestId } = await render(<ItemSpyTrackerIcon message={messageWithoutTrackers} />, false);

        const icon = await findByTestId('privacy:tracker-icon');
        fireEvent.click(icon);

        const modal = await findByTestId('spyTrackerModal:noTrackers');
        getByTextDefault(modal, 'No email trackers found');
    });

    it('should open a modal to set trackers protection mode', async () => {
        minimalCache();
        setFeatureFlags('SpyTrackerProtection', true);
        addToCache('MailSettings', { ImageProxy: IMAGE_PROXY_FLAGS.NONE, ShowImages: SHOW_IMAGES.NONE });

        const { findByTestId } = await render(<ItemSpyTrackerIcon message={messageWithoutTrackers} />, false);

        const icon = await findByTestId('privacy:tracker-icon');
        fireEvent.click(icon);

        const modal = await findByTestId('spyTrackerModal:needsMoreProtection');
        getByTextDefault(modal, 'Email tracker protection is disabled');

        const settingToggle = queryByTestIdDefault(modal, 'privacy:prevent-tracking-toggle');
        expect(settingToggle).toBeTruthy();
    });

    it('should open a modal to list all trackers found', async () => {
        minimalCache();
        setFeatureFlags('SpyTrackerProtection', true);
        addToCache('MailSettings', { ImageProxy: IMAGE_PROXY_FLAGS.ALL, ShowImages: SHOW_IMAGES.ALL });

        const { findByTestId } = await render(<ItemSpyTrackerIcon message={messageWithTrackers} />, false);

        const icon = await findByTestId('privacy:tracker-icon');
        fireEvent.click(icon);

        const modal = await findByTestId('spyTrackerModal:trackers');
        getByTextDefault(modal, '2 email trackers blocked');

        await findByTextDefault(modal, 'Tracker 1');
        await findByTextDefault(modal, 'Tracker 2');

        const trackersBubbles = queryAllByTestIdDefault(modal, 'privacy:icon-number-of-trackers');
        trackersBubbles.forEach((trackerBubble) => {
            expect(trackerBubble.innerHTML).toEqual('1');
        });
    });
});
