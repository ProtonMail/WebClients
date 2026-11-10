import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import type { Subscription } from '@proton/payments/core/subscription/interface';
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
} as unknown as Subscription;

vi.mock('@proton/shared/lib/telemetry', () => ({
    telemetry: {
        sendCustomEvent: vi.fn(),
    },
}));

const telemetryCall = telemetry.sendCustomEvent as unknown as Mock;

describe('FeedbackSurveyModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should render', () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        expect(screen.getByText('How did you find out about us?')).toBeInTheDocument();
    });

    it('should have "submit" button disabled if no value is selected', () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        expect(screen.getByText('Submit')).toBeDisabled();
    });

    it('should have "submit" button disabled if value is "Other" and the input content is empty', async () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        await userEvent.click(screen.getByText('Other'));

        await screen.findByRole('textbox', { hidden: true });
        await waitFor(() => expect(screen.getByText('Submit')).toBeDisabled());
    });

    it('should have "submit" button enabled if value anything but "Other"', async () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        await userEvent.click(screen.getByText('TikTok'));

        await waitFor(() => expect(screen.getByText('Submit')).toBeEnabled());
    });

    it('should trigger a network request when dismiss', async () => {
        const onClose = vi.fn();

        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={onClose} />);

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
        const onClose = vi.fn();

        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={onClose} />);

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

    it('should send the custom text as source when submitting "Other"', async () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        await userEvent.click(screen.getByText('Other'));
        await userEvent.type(await screen.findByRole('textbox', { hidden: true }), 'A friend of mine');
        await userEvent.click(screen.getByText('Submit'));

        expect(telemetryCall).toHaveBeenCalledWith('feedbackPurchaseSurvey', {
            channel_category: 'other',
            channel_source: 'A friend of mine',
            platform: 'web',
            subscription_plan: 'vpn_plus_24',
        });
    });

    it('should send the selected sub-option as value when submitting', async () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        await userEvent.click(screen.getByText('YouTube'));
        await userEvent.click(screen.getByText('Please specify...'));
        await userEvent.click(await screen.findByText('David Bombal'));
        await userEvent.click(screen.getByText('Submit'));

        expect(telemetryCall).toHaveBeenCalledWith('feedbackPurchaseSurvey', {
            channel_category: 'social_media',
            channel_source: 'YouTube',
            youtube_value: 'david_bombal',
            platform: 'web',
            subscription_plan: 'vpn_plus_24',
        });
    });

    it('should send the normalized custom text as value when submitting a custom sub-option', async () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        await userEvent.click(screen.getByText('YouTube'));
        await userEvent.click(screen.getByText('Please specify...'));
        await userEvent.type(screen.getByRole('searchbox'), '  My Favorite   Channel ');
        await userEvent.click(await screen.findByText('My Favorite Channel'));
        await userEvent.click(screen.getByText('Submit'));

        expect(telemetryCall).toHaveBeenCalledWith('feedbackPurchaseSurvey', {
            channel_category: 'social_media',
            channel_source: 'YouTube',
            youtube_value: 'my_favorite_channel',
            platform: 'web',
            subscription_plan: 'vpn_plus_24',
        });
    });

    it.each(['Snake Banter', 'snake_banter', 'Snake  Banter'])(
        'should offer the predefined sub-option when the search "%s" normalizes to its value',
        async (search) => {
            render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

            await userEvent.click(screen.getByText('Podcast'));
            await userEvent.click(screen.getByText('Please specify...'));
            await userEvent.type(screen.getByRole('searchbox'), search);
            await userEvent.click(await screen.findByText('Snake & Banter'));
            await userEvent.click(screen.getByText('Submit'));

            expect(telemetryCall).toHaveBeenCalledWith(
                'feedbackPurchaseSurvey',
                expect.objectContaining({ channel_source: 'Podcast', podcast_value: 'snake_banter' })
            );
        }
    );

    it('should keep submit disabled when "Other" input only contains whitespace', async () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        await userEvent.click(screen.getByText('Other'));
        await userEvent.type(await screen.findByRole('textbox', { hidden: true }), '   ');

        expect(screen.getByText('Submit')).toBeDisabled();
    });

    it('should trim the custom text sent as source when submitting "Other"', async () => {
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        await userEvent.click(screen.getByText('Other'));
        await userEvent.type(await screen.findByRole('textbox', { hidden: true }), '  A friend  ');
        await userEvent.click(screen.getByText('Submit'));

        expect(telemetryCall).toHaveBeenCalledWith(
            'feedbackPurchaseSurvey',
            expect.objectContaining({ channel_category: 'other', channel_source: 'A friend' })
        );
    });

    it('should not offer a custom sub-option when the search only contains whitespace', async () => {
        const whitespace = '   ';
        render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={vi.fn()} />);

        await userEvent.click(screen.getByText('YouTube'));
        await userEvent.click(screen.getByText('Please specify...'));
        await userEvent.type(screen.getByRole('searchbox'), whitespace);

        expect(screen.queryByTitle(whitespace, { normalizer: (title) => title })).not.toBeInTheDocument();
        expect(screen.getByText('Submit')).toBeDisabled();
    });

    it.each(['Podcast', 'YouTube', 'Twitch', 'Other'])(
        'should disable submit button when %s option is selected but there is no value selected',
        async (option) => {
            const onClose = vi.fn();

            render(<FeedbackSurveyModal open subscription={defaultSubscription} onClose={onClose} />);

            await userEvent.click(screen.getByText(option));

            expect(screen.getByText('Submit')).toBeDisabled();
        }
    );
});
