import { fireEvent, screen } from '@testing-library/react';

import type { MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import { mailTestRender } from 'proton-mail/helpers/test/helper';
import { optimisticUpdateFlag } from 'proton-mail/store/messages/optimistic/messagesOptimisticActions';

import ExtraSpamScore from './ExtraSpamScore';

const mockDispatch = jest.fn();
jest.mock('proton-mail/store/hooks', () => ({
    useMailDispatch: () => mockDispatch,
    useMailSelector: jest.fn().mockReturnValue(jest.fn()),
    useMailStore: jest.fn().mockReturnValue({ getState: jest.fn() }),
}));

describe('ExtraSpamScore', () => {
    it('should show DMARC validation failure banner', async () => {
        const message = {
            data: {
                Flags: MESSAGE_FLAGS.FLAG_DMARC_FAIL,
            },
        } as unknown as MessageStateWithData;

        await mailTestRender(<ExtraSpamScore message={message} />);
        expect(screen.getByTestId('spam-banner:dmarc-validation-failure')).toBeInTheDocument();
    });

    it('should show phishing banner if auto flagged as phishing', async () => {
        const message = {
            data: {
                Flags: MESSAGE_FLAGS.FLAG_PHISHING_AUTO,
            },
        } as unknown as MessageStateWithData;

        await mailTestRender(<ExtraSpamScore message={message} />);
        expect(screen.getByTestId('spam-banner:phishing-banner')).toBeInTheDocument();
    });

    it('should show mark legitimate prompt', async () => {
        const message = {
            data: {
                Flags: MESSAGE_FLAGS.FLAG_PHISHING_AUTO,
            },
        } as unknown as MessageStateWithData;

        await mailTestRender(<ExtraSpamScore message={message} />);

        fireEvent.click(screen.getByTestId('spam-banner:mark-legitimate'));
        expect(screen.getByTestId('spam-banner:mark-legitimate-prompt')).toBeInTheDocument();
    });

    it('should dispatch optimisticUpdateFlag after marking as legitimate', async () => {
        const message = {
            data: {
                ID: 'test-message-id',
                Flags: MESSAGE_FLAGS.FLAG_PHISHING_AUTO,
            },
        } as unknown as MessageStateWithData;

        await mailTestRender(<ExtraSpamScore message={message} />);

        fireEvent.click(screen.getByTestId('spam-banner:mark-legitimate'));
        expect(screen.getByTestId('spam-banner:mark-legitimate-prompt')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('spam-banner:mark-legitimate-prompt-btn'));

        expect(mockDispatch).toHaveBeenCalledWith(
            optimisticUpdateFlag({
                ID: 'test-message-id',
                flagToAdd: MESSAGE_FLAGS.FLAG_HAM_MANUAL,
            })
        );
    });

    describe('banner copy change test', () => {
        it('should show phishing banner if suspicious flagged', async () => {
            const message = {
                data: {
                    Flags: Number(MESSAGE_FLAGS.FLAG_SUSPICIOUS),
                },
            } as unknown as MessageStateWithData;

            await mailTestRender(<ExtraSpamScore message={message} />);
            expect(screen.getByTestId('spam-banner:phishing-banner')).toBeInTheDocument();

            const banner = screen.getByText(
                'Our system flagged this message as a phishing attempt. Please check to ensure that it is legitimate.'
            );

            expect(banner).toBeInTheDocument();
        });

        it('should not show phishing banner if suspicious flagged and manual flagged ham', async () => {
            const message = {
                data: {
                    Flags: MESSAGE_FLAGS.FLAG_PHISHING_AUTO,
                },
            } as unknown as MessageStateWithData;

            await mailTestRender(<ExtraSpamScore message={message} />);
            const banner = screen.getByTestId('spam-banner:phishing-banner');
            expect(banner).toBeInTheDocument();

            const bannerCopy = screen.getByText(
                'Our system flagged this as suspicious. If it is not a phishing or scam email, mark as legitimate.'
            );
            expect(bannerCopy).toBeInTheDocument();
        });
    });
});
