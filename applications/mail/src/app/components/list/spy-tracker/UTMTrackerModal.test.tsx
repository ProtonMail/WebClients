import { screen } from '@testing-library/react';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import { mailTestRender } from '../../../helpers/tests/render';
import UTMTrackerModal from './UTMTrackerModal';

const message: MessageState = {
    localID: 'messageWithUTMTrackerId',
    messageUTMTrackers: [
        {
            originalURL: 'http://tracker.com/?utm_source=tracker',
            cleanedURL: 'http://tracker.com',
            removed: [{ key: 'utm_source', value: 'tracker' }],
        },
    ] as MessageUTMTracker[],
};

describe('UTMTrackerModal', () => {
    it('should display the cleaned url and a copy button for it', async () => {
        await mailTestRender(<UTMTrackerModal message={message} open onClose={jest.fn()} />);

        const modal = await screen.findByTestId('utmTrackerModal:trackers');

        expect(modal).toHaveTextContent('http://tracker.com/?utm_source=tracker');
        expect(modal).toHaveTextContent('http://tracker.com');

        const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
        expect(copyButtons).toHaveLength(2);
    });
});
