import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { fireEvent } from '@testing-library/dom';
import { render } from '../../helpers/test/render';
import ItemSpyTrackerIcon from './ItemSpyTrackerIcon';
import { addToCache, minimalCache } from '../../helpers/test/cache';
import { setFeatureFlags } from '../../helpers/test/api';
import { MessageExtended } from '../../models/message';

const messageWithTrackers: MessageExtended = {
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
                tracker: 'Tracker',
                cid: 'cid',
                cloc: 'cloc',
                attachment: {},
            },
        ],
    },
};

const messageWithoutTrackers: MessageExtended = {
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
        ${IMAGE_PROXY_FLAGS.ALL}  | ${SHOW_IMAGES.ALL}  | ${messageWithTrackers}    | ${true}         | ${true}           | ${'To protect your privacy, Proton blocked email trackers in this message'}
        ${IMAGE_PROXY_FLAGS.ALL}  | ${SHOW_IMAGES.ALL}  | ${messageWithoutTrackers} | ${true}         | ${false}          | ${'No email trackers found'}
        ${IMAGE_PROXY_FLAGS.ALL}  | ${SHOW_IMAGES.NONE} | ${messageWithTrackers}    | ${true}         | ${true}           | ${'To protect your privacy, Proton blocked email trackers in this message'}
        ${IMAGE_PROXY_FLAGS.ALL}  | ${SHOW_IMAGES.NONE} | ${messageWithoutTrackers} | ${true}         | ${false}          | ${'No email trackers found'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${SHOW_IMAGES.NONE} | ${messageWithTrackers}    | ${true}         | ${true}           | ${'Protect yourself from trackers. Turn on email tracker protection in settings'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${SHOW_IMAGES.NONE} | ${messageWithoutTrackers} | ${true}         | ${false}          | ${'Protect yourself from trackers. Turn on email tracker protection in settings'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${SHOW_IMAGES.ALL}  | ${messageWithTrackers}    | ${true}         | ${true}           | ${'To protect your privacy, Proton blocked email trackers in this message'}
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
                    expect(numberOfTrackers?.innerHTML).toEqual('1');
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
});
