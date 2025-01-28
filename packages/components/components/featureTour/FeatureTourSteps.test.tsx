import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as featureTourActions from '@proton/account/featuresTour/actions';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import FeatureTourSteps from './FeatureTourSteps';
import { FEATURE_TOUR_STEPS_MAP } from './constants';
import type { FeatureTourStepId } from './interface';

// Mock the step components
jest.mock('./constants', () => ({
    FEATURE_TOUR_STEPS_MAP: {
        'short-domain': {
            component: ({ onNext, bullets }: any) => (
                <div data-testid="step-short-domain">
                    Step 1 {bullets}
                    <button onClick={onNext}>Next</button>
                </div>
            ),
            shouldDisplay: jest
                .fn()
                .mockResolvedValue({ canDisplay: true, preloadIllustration: () => Promise.resolve() }),
        },
        'auto-delete': {
            component: ({ onNext, bullets }: any) => (
                <div data-testid="step-auto-delete">
                    Step 2 {bullets}
                    <button onClick={onNext}>Next</button>
                </div>
            ),
            shouldDisplay: jest
                .fn()
                .mockResolvedValue({ canDisplay: true, preloadIllustration: () => Promise.resolve() }),
        },
    },
}));

jest.mock('@proton/account/featuresTour/actions', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/account/featuresTour/actions'),
}));

describe('FeatureTourSteps', () => {
    const mockOnClose = jest.fn();
    const stepsList: FeatureTourStepId[] = ['short-domain', 'auto-delete'];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = () => {
        return renderWithProviders(<FeatureTourSteps onFinishTour={mockOnClose} stepsList={stepsList} />);
    };

    it('should show loader while initializing steps', () => {
        renderComponent();
        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('should initialize with first step active', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByTestId('step-short-domain')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('step-auto-delete')).not.toBeInTheDocument();
    });

    it('should navigate to next step when clicking next button', async () => {
        renderComponent();
        const nextButton = await screen.findByRole('button', { name: /next/i });

        await userEvent.click(nextButton);

        expect(screen.queryByTestId('step-short-domain')).not.toBeInTheDocument();
        expect(screen.getByTestId('step-auto-delete')).toBeInTheDocument();
    });

    it('should close and dispatch completed action on last step next click', async () => {
        renderComponent();
        const completedFeatureTourActionMock = jest.fn();
        jest.spyOn(featureTourActions, 'completedFeatureTourAction').mockReturnValue(completedFeatureTourActionMock);

        // Navigate to last step
        const firstNextButton = await screen.findByRole('button', { name: /next/i });
        await userEvent.click(firstNextButton);

        // Click next on last step
        const lastNextButton = await screen.findByRole('button', { name: /next/i });
        await userEvent.click(lastNextButton);

        expect(mockOnClose).toHaveBeenCalled();
        expect(completedFeatureTourActionMock).toHaveBeenCalled();
    });

    it('should navigate to specific step when clicking bullet', async () => {
        renderComponent();

        // Wait for steps to initialize
        await screen.findByTestId('step-short-domain');

        // Find and click the second step bullet
        const autoDeleteBullet = await screen.findByTestId('step-bullet-auto-delete');
        await userEvent.click(autoDeleteBullet);

        expect(screen.queryByTestId('step-short-domain')).toBeNull();
        expect(screen.getByTestId('step-auto-delete')).toBeInTheDocument();
    });

    it('should filter out steps that should not be displayed', async () => {
        const completedFeatureTourActionMock = jest.fn();
        jest.spyOn(featureTourActions, 'completedFeatureTourAction').mockReturnValue(completedFeatureTourActionMock);

        // Mock one step to not be displayed
        jest.mocked(FEATURE_TOUR_STEPS_MAP['auto-delete'].shouldDisplay).mockResolvedValue({
            canDisplay: false,
            preloadUrls: [],
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByTestId('step-short-domain')).toBeInTheDocument();
        });

        const nextButton = screen.getByRole('button', { name: /next/i });
        await userEvent.click(nextButton);

        // Should close immediately since there are no more visible steps
        expect(mockOnClose).toHaveBeenCalled();
        expect(screen.queryByTestId('step-auto-delete')).not.toBeInTheDocument();
        expect(completedFeatureTourActionMock).toHaveBeenCalled();
    });
});
