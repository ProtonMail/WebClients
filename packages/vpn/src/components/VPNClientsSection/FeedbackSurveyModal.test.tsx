import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { telemetry } from '@proton/shared/lib/telemetry';

import { FeedbackSurveyModal } from './FeedbackSurveyModal';

const defaultSubscription = {
    Cycle: 24,
    RenewCycle: 12,
    Currency: 'CHF',
    Plans: [
        {
            Type: 1,
            Name: 'vpn2024',
            Title: 'VPN Plus',
            Cycle: 24,
            Currency: 'CHF',
            Offer: 'default',
            Quantity: 1,
        },
    ],
    Renew: 1,
    External: 0,
    IsTrial: false,
};

jest.mock('@proton/account/subscription/hooks', () => ({
    useSubscription: () => [defaultSubscription],
}));

jest.mock('@proton/shared/lib/telemetry', () => ({
    telemetry: {
        sendCustomEvent: jest.fn(),
    },
}));

const telemetryCall = telemetry.sendCustomEvent as unknown as jest.Mock;

describe('FeedbackSurveyModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should render', () => {
        render(<FeedbackSurveyModal open onClose={jest.fn()} />);

        expect(screen.getByText('How did you find out about us?')).toBeInTheDocument();
    });

    it('should have "submit" button disabled if no value is selected', () => {
        render(<FeedbackSurveyModal open onClose={jest.fn()} />);

        expect(screen.getByText('Submit')).toBeDisabled();
    });

    it('should have "submit" button disabled if value is "Other" and the input content is empty', async () => {
        render(<FeedbackSurveyModal open onClose={jest.fn()} />);

        await userEvent.click(screen.getByText('Other'));

        await screen.findByPlaceholderText('Please specify...');
        await waitFor(() => expect(screen.getByText('Submit')).toBeDisabled());
    });

    it('should have "submit" button enabled if value anything but "Other"', async () => {
        render(<FeedbackSurveyModal open onClose={jest.fn()} />);

        await userEvent.click(screen.getByText('TikTok'));

        await waitFor(() => expect(screen.getByText('Submit')).toBeEnabled());
    });

    it('should trigger a network request when dismiss', async () => {
        const onClose = jest.fn();

        render(<FeedbackSurveyModal open onClose={onClose} />);

        await userEvent.click(screen.getByText('Cancel'));

        expect(telemetryCall).toHaveBeenCalledWith(
            'feedbackPurchaseSurvey',
            expect.objectContaining({
                channel_category: 'skipped',
                channel_source: '',
            })
        );
        expect(onClose).toHaveBeenCalled();
    });
    it('should trigger a network request when submitting', async () => {
        const onClose = jest.fn();

        render(<FeedbackSurveyModal open onClose={onClose} />);

        await userEvent.click(screen.getByText('TikTok'));
        await userEvent.click(screen.getByText('Submit'));

        expect(telemetryCall).toHaveBeenCalledWith('feedbackPurchaseSurvey', {
            channel_category: 'social_media',
            channel_source: 'TikTok',
            platform: 'web',
            subscription_plan: 'vpn_plus_24',
        });
        expect(onClose).toHaveBeenCalled();
    });
});
