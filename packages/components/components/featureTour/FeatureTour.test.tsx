import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import { featureTourActions } from '@proton/account/featuresTour';
import * as featureTourActionsModule from '@proton/account/featuresTour/actions';
import { getModelState } from '@proton/account/testing/getModelState';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import * as useFlagModule from '@proton/unleash/useFlag';

import { renderWithProviders } from '../../testing/vitest/renderWithProviders';
import FeatureTour from './FeatureTour';

vi.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: vi.fn(() => ({ feature: { Value: null } })),
}));

vi.mock('@proton/account/featuresTour/actions', async () => ({
    __esModule: true,
    ...(await vi.importActual('@proton/account/featuresTour/actions')),
}));

describe('FeatureTour', () => {
    let useFlagSpy: MockInstance;

    beforeEach(() => {
        vi.clearAllMocks();
        useFlagSpy = vi.spyOn(useFlagModule, 'useFlag').mockReturnValue(true);
    });

    afterEach(() => {
        useFlagSpy.mockRestore();
    });

    const renderComponent = (preloadedState = {}) => {
        return renderWithProviders(<FeatureTour />, {
            preloadedState: {
                featureTour: {
                    display: true,
                    steps: ['short-domain', 'auto-delete'],
                    activatedFeatures: [],
                    origin: 'postSubscription',
                    ...preloadedState,
                },
                mailSettings: getModelState({} as MailSettings),
            },
        });
    };

    it('should not render when feature flag is disabled', () => {
        useFlagSpy.mockReturnValue(false);
        renderComponent();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not render when display is false', () => {
        renderComponent({ display: false });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render modal loader when display is true and feature flag is enabled', async () => {
        renderComponent();
        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('should dispatch hide action when modal is closed', async () => {
        const hideActionMock = vi.fn();
        vi.spyOn(featureTourActions, 'hide').mockReturnValue(hideActionMock as any);

        renderComponent();
        const closeButton = await screen.findByRole('button', { name: /close/i }, { timeout: 5000 });

        await userEvent.click(closeButton);

        expect(hideActionMock).toHaveBeenCalled();
    });

    it('should dispatch remind me later action when closed without expiration date', async () => {
        const remindMeLaterMock = vi.fn();
        vi.spyOn(featureTourActionsModule, 'remindMeLaterAboutFeatureTourAction').mockReturnValue(remindMeLaterMock);
        renderComponent();
        const closeButton = await screen.findByRole('button', { name: /close/i }, { timeout: 5000 });

        await userEvent.click(closeButton);

        expect(remindMeLaterMock).toHaveBeenCalled();
    });

    it('should not dispatch remind me later action when closed with expiration date', async () => {
        const remindMeLaterMock = vi.fn();
        vi.spyOn(featureTourActionsModule, 'remindMeLaterAboutFeatureTourAction').mockReturnValue(remindMeLaterMock);
        (await vi.importMock<any>('@proton/features/useFeature')).default.mockReturnValue({
            feature: { Value: '2024-12-31' },
        });

        renderComponent();
        const closeButton = await screen.findByRole('button', { name: /close/i }, { timeout: 5000 });

        await userEvent.click(closeButton);

        expect(remindMeLaterMock).not.toHaveBeenCalled();
    });
});
