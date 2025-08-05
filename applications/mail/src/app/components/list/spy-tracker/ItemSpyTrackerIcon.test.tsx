import { fireEvent, getByText, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import { minimalCache } from '../../../helpers/test/cache';
import { clearAll } from '../../../helpers/test/helper';
import { mailTestRender } from '../../../helpers/test/render';
import ItemSpyTrackerIcon from './ItemSpyTrackerIcon';

jest.mock('@proton/components/hooks/useProgressiveRollout', () => {
    return {
        __esModule: true,
        default: jest.fn(() => true),
    };
});

const messageWithTrackers: MessageState = {
    localID: 'messageWithTrackerId',
    messageImages: {
        hasEmbeddedImages: true,
        hasRemoteImages: false,
        showEmbeddedImages: true,
        showRemoteImages: true,
        trackersStatus: 'loaded',
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
    messageUTMTrackers: [
        {
            originalURL: 'http://tracker.com/utm_content=tracker',
            cleanedURL: 'http://tracker.com',
            removed: [{ key: 'utm_source', value: 'tracker' }],
        },
    ] as MessageUTMTracker[],
};

const messageWithoutTrackers: MessageState = {
    localID: 'messageWithoutTrackerId',
    messageImages: {
        hasEmbeddedImages: true,
        hasRemoteImages: false,
        showEmbeddedImages: true,
        showRemoteImages: true,
        trackersStatus: 'loaded',
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
    afterEach(() => {
        clearAll();
    });

    it.each`
        imageProxy                | message                   | isIconDisplayed | isNumberDisplayed | expectedTooltip
        ${IMAGE_PROXY_FLAGS.ALL}  | ${messageWithTrackers}    | ${true}         | ${true}           | ${'2 email trackers blocked'}
        ${IMAGE_PROXY_FLAGS.ALL}  | ${messageWithoutTrackers} | ${true}         | ${false}          | ${'No email trackers found'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${messageWithTrackers}    | ${true}         | ${true}           | ${'Email tracker protection is disabled'}
        ${IMAGE_PROXY_FLAGS.NONE} | ${messageWithoutTrackers} | ${true}         | ${false}          | ${'Email tracker protection is disabled'}
    `(
        'should display the icon [$isIconDisplayed] with number [$isNumberDisplayed] when proxy is [$imageProxy]',
        async ({ imageProxy, message, isIconDisplayed, isNumberDisplayed }) => {
            minimalCache();

            const { queryByTestId } = await mailTestRender(<ItemSpyTrackerIcon message={message} />, {
                preloadedState: {
                    mailSettings: getModelState({
                        ImageProxy: imageProxy,
                    } as MailSettings),
                },
            });

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
                    expect(numberOfTrackers?.innerHTML).toEqual('3');
                } else {
                    expect(numberOfTrackers).toBeNull();
                }
            }
        }
    );

    it('should open the privacy dropdown with trackers info', async () => {
        minimalCache();

        await mailTestRender(<ItemSpyTrackerIcon message={messageWithTrackers} />, {
            preloadedState: {
                mailSettings: getModelState({
                    ImageProxy: IMAGE_PROXY_FLAGS.ALL,
                } as MailSettings),
            },
        });

        const icon = await screen.findByTestId('privacy:tracker-icon');
        fireEvent.click(icon);

        // Dropdown title
        const title = screen.getByTestId('privacy:title');
        getByText(title, 'We protected you from 3 trackers');

        const imageTrackerRow = screen.getByTestId('privacy:image-row');
        const utmTrackerRow = screen.getByTestId('privacy:utm-row');

        getByText(imageTrackerRow, '2 trackers blocked');
        getByText(utmTrackerRow, '1 link cleaned');
    });

    it('should open the privacy dropdown with no trackers found', async () => {
        minimalCache();

        await mailTestRender(<ItemSpyTrackerIcon message={messageWithoutTrackers} />, {
            preloadedState: {
                mailSettings: getModelState({
                    ImageProxy: IMAGE_PROXY_FLAGS.ALL,
                } as MailSettings),
            },
        });

        const icon = await screen.findByTestId('privacy:tracker-icon');
        fireEvent.click(icon);

        // Dropdown title
        const title = screen.getByTestId('privacy:title');
        getByText(title, 'No trackers found');

        // Description is displayed
        screen.getByText("We didn't find any known trackers and tracking URLs in this email.");
    });

    it('should open the privacy dropdown with no protection', async () => {
        minimalCache();

        await mailTestRender(<ItemSpyTrackerIcon message={messageWithTrackers} />, {
            preloadedState: {
                mailSettings: getModelState({
                    ImageProxy: IMAGE_PROXY_FLAGS.NONE,
                } as MailSettings),
            },
        });

        const icon = await screen.findByTestId('privacy:tracker-icon');
        fireEvent.click(icon);

        // Dropdown title
        const title = screen.getByTestId('privacy:title');
        getByText(title, 'Protect yourself from trackers');

        screen.getByTestId('privacy:prevent-tracking-toggle');
        // Description is displayed
        screen.getByText(
            'Turn on email tracker protection to prevent advertisers and others from tracking your location and online activity.'
        );
    });

    it('should open the image tracker modal and list expected info', async () => {
        minimalCache();

        await mailTestRender(<ItemSpyTrackerIcon message={messageWithTrackers} />, {
            preloadedState: {
                mailSettings: getModelState({
                    ImageProxy: IMAGE_PROXY_FLAGS.ALL,
                } as MailSettings),
            },
        });

        const icon = await screen.findByTestId('privacy:tracker-icon');
        fireEvent.click(icon);

        const imageTrackerRow = screen.getByTestId('privacy:image-row');

        // Open the image tracker modal
        fireEvent.click(imageTrackerRow);

        const modal = screen.getByTestId('spyTrackerModal:trackers');

        getByText(
            modal,
            'We blocked the following advertisers and organizations from seeing when you open this email, what device you’re using, and where you’re located.'
        );

        // Trackers are visible
        getByText(modal, 'Tracker 1');
        getByText(modal, 'Tracker 2');
    });

    it('should open the utm tracker modal and list expected info', async () => {
        minimalCache();

        await mailTestRender(<ItemSpyTrackerIcon message={messageWithTrackers} />, {
            preloadedState: {
                mailSettings: getModelState({
                    ImageProxy: IMAGE_PROXY_FLAGS.ALL,
                } as MailSettings),
            },
        });

        const icon = await screen.findByTestId('privacy:tracker-icon');
        fireEvent.click(icon);

        const utmTrackerRow = screen.getByTestId('privacy:utm-row');

        // Open the utm tracker modal
        fireEvent.click(utmTrackerRow);

        const modal = screen.getByTestId('utmTrackerModal:trackers');

        getByText(
            modal,
            'We removed tracking information from the following links to help protect you from advertisers and others trying to track your online activity.'
        );

        // Trackers are visible
        getByText(modal, 'http://tracker.com/utm_content=tracker');
    });
});
