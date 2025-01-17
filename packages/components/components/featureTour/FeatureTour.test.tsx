import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { featureTourActions } from '@proton/account/featuresTour';
import * as featureTourActionsModule from '@proton/account/featuresTour/actions';
import { getModelState } from '@proton/account/test';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';
import * as useFlagModule from '@proton/unleash/useFlag';

import FeatureTour from './FeatureTour';
import type { FeatureTourStepId } from './interface';

jest.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: jest.fn(() => ({ feature: { Value: null } })),
}));

describe('FeatureTour', () => {
    let useFlagSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        useFlagSpy = jest.spyOn(useFlagModule, 'default').mockReturnValue(true);
    });

    afterEach(() => {
        useFlagSpy.mockRestore();
    });

    const renderComponent = (preloadedState = {}) => {
        return renderWithProviders(<FeatureTour />, {
            preloadedState: {
                featureTour: {
                    display: true,
                    steps: ['short-domain', 'auto-delete'] as FeatureTourStepId[],
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
        const hideActionMock = jest.fn();
        jest.spyOn(featureTourActions, 'hide').mockReturnValue(hideActionMock as any);

        renderComponent();
        const closeButton = await screen.findByRole('button', { name: /close/i });

        await userEvent.click(closeButton);

        expect(hideActionMock).toHaveBeenCalled();
    });

    it('should dispatch remind me later action when closed without expiration date', async () => {
        const remindMeLaterMock = jest.fn();
        jest.spyOn(featureTourActionsModule, 'remindMeLaterAboutFeatureTourAction').mockReturnValue(remindMeLaterMock);
        renderComponent();
        const closeButton = await screen.findByRole('button', { name: /close/i });

        await userEvent.click(closeButton);

        expect(remindMeLaterMock).toHaveBeenCalled();
    });

    it('should not dispatch remind me later action when closed with expiration date', async () => {
        const remindMeLaterMock = jest.fn();
        jest.spyOn(featureTourActionsModule, 'remindMeLaterAboutFeatureTourAction').mockReturnValue(remindMeLaterMock);
        jest.requireMock('@proton/features/useFeature').default.mockReturnValue({
            feature: { Value: '2024-12-31' },
        });

        renderComponent();
        const closeButton = await screen.findByRole('button', { name: /close/i });

        await userEvent.click(closeButton);

        expect(remindMeLaterMock).not.toHaveBeenCalled();
    });
});
