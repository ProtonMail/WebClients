import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { mockUseHistory } from '@proton/testing';

import { getHumanLabelID } from 'proton-mail/helpers/labels';

import AlmostAllMailBanner from './AlmostAllMailBanner';

describe('AlmostAllMailBanner', () => {
    beforeEach(() => {
        mockUseHistory({
            location: {
                pathname: `/${getHumanLabelID(MAILBOX_LABEL_IDS.INBOX)}`,
                search: '',
                state: {},
                hash: '',
            },
        });
    });

    describe('when use is in AlmostAllMail location', () => {
        let mockedPush: jest.Mock;

        beforeEach(() => {
            mockedPush = jest.fn();
            mockUseHistory({
                push: mockedPush,
            });
        });

        it('should render banner', () => {
            render(<AlmostAllMailBanner />);

            expect(screen.getByText("Can't find what you're looking for?")).toBeInTheDocument();

            const button = screen.getByRole('button', { name: /Include Spam\/Trash/ });
            expect(button).toBeInTheDocument();
        });

        describe('when user click on banner button', () => {
            it('should push new route to history', async () => {
                render(<AlmostAllMailBanner />);

                const button = screen.getByRole('button', { name: /Include Spam\/Trash/ });
                expect(button).toBeInTheDocument();

                await userEvent.click(button);

                await waitFor(() => {
                    expect(mockedPush).toHaveBeenCalledTimes(1);
                });

                expect(mockedPush).toHaveBeenCalledWith('/all-mail');
            });
        });
    });
});
