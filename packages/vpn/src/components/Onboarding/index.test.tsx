import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockedFunction } from 'vitest';

import { useOrganization } from '@proton/account/organization/hooks';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';

import { useOnOrganizationNameSetup } from '../../hooks/useOnOrganizationNameSetup';
import { useOnboarding } from '../../hooks/useOnboarding';
import { ONBOARDING_STEPS } from '../../types/Onboarding';
import { GetStartedOnboarding } from './index';

vi.mock('@proton/account/organization/hooks', () => ({
    useOrganization: vi.fn(),
}));

vi.mock('@proton/components/containers/organization/SetupOrganizationNameModal', () => ({
    SetupOrganizationNameModal: ({ onSubmit, open }: { onSubmit: (name: string) => void; open: boolean }) =>
        open ? <button onClick={() => onSubmit('My Org')}>setup-org-modal</button> : null,
}));

vi.mock('@proton/components/hooks/useNotifications', () => ({
    default: vi.fn().mockReturnValue({
        createNotification: vi.fn(),
    }),
}));

vi.mock('@proton/components/components/link/useSettingsLink', () => ({
    default: vi.fn(),
}));

vi.mock('../../hooks/useOnOrganizationNameSetup', () => ({
    useOnOrganizationNameSetup: vi.fn(),
}));

vi.mock('../../hooks/useOnboarding', () => ({
    useOnboarding: vi.fn(),
}));

vi.mock('@proton/components/components/topnavbar/GetStartedButton', () => ({
    GetStartedButton: ({ onDismiss }: { onDismiss: () => void }) => (
        <button onClick={onDismiss}>get-started-button</button>
    ),
}));

vi.mock('./OnboardedQuickActions', () => ({
    OnboardedQuickActions: ({ onDismiss }: { onDismiss: () => void }) => (
        <button onClick={onDismiss}>onboarded-quick-actions</button>
    ),
}));

const mockUseOrganization = useOrganization as MockedFunction<typeof useOrganization>;
const mockUseSettingsLink = useSettingsLink as MockedFunction<typeof useSettingsLink>;
const mockUseOnOrganizationNameSetup = useOnOrganizationNameSetup as MockedFunction<typeof useOnOrganizationNameSetup>;
const mockUseOnboarding = useOnboarding as MockedFunction<typeof useOnboarding>;

const mockOrganization = { Name: 'Test Org' } as ReturnType<typeof useOrganization>[0];

describe('GetStartedOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOrganization.mockReturnValue([mockOrganization, false]);
        mockUseSettingsLink.mockReturnValue(vi.fn());
        mockUseOnOrganizationNameSetup.mockReturnValue(vi.fn());
        mockUseOnboarding.mockReturnValue([ONBOARDING_STEPS.Onboarded, vi.fn(), vi.fn()]);
    });

    it('renders nothing when there is no organization', () => {
        mockUseOrganization.mockReturnValue([undefined, false]);

        const { container } = render(<GetStartedOnboarding />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders SetupOrganizationNameModal when not onboarded', () => {
        mockUseOnboarding.mockReturnValue([ONBOARDING_STEPS.NotOnboarded, vi.fn(), vi.fn()]);

        render(<GetStartedOnboarding />);

        expect(screen.getByText('setup-org-modal')).toBeInTheDocument();
    });

    it('renders OnboardedQuickActions when onboarded', () => {
        render(<GetStartedOnboarding />);

        expect(screen.getByText('onboarded-quick-actions')).toBeInTheDocument();
    });

    it('renders nothing when not eligible', () => {
        mockUseOnboarding.mockReturnValue([ONBOARDING_STEPS.NotEligible, vi.fn(), vi.fn()]);

        const { container } = render(<GetStartedOnboarding />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when dismissed', () => {
        mockUseOnboarding.mockReturnValue([ONBOARDING_STEPS.Dismissed, vi.fn(), vi.fn()]);

        const { container } = render(<GetStartedOnboarding />);

        expect(container).toBeEmptyDOMElement();
    });

    it('calls onOrganizationNameSetup with submitted name, then onboarded, then navigates', async () => {
        const mockOnboarded = vi.fn().mockResolvedValue(undefined);
        const mockOnOrganizationNameSetup = vi.fn().mockResolvedValue(undefined);
        const mockGoToSettings = vi.fn();

        mockUseOnboarding.mockReturnValue([ONBOARDING_STEPS.NotOnboarded, mockOnboarded, vi.fn()]);
        mockUseOnOrganizationNameSetup.mockReturnValue(mockOnOrganizationNameSetup);
        mockUseSettingsLink.mockReturnValue(mockGoToSettings);

        render(<GetStartedOnboarding />);

        await userEvent.click(screen.getByText('setup-org-modal'));

        expect(mockOnOrganizationNameSetup).toHaveBeenCalledWith('My Org');
        await waitFor(() => expect(mockOnboarded).toHaveBeenCalled());
        await waitFor(() => expect(mockGoToSettings).toHaveBeenCalledWith('/users-addresses'));
    });

    it('passes completed as onDismiss to OnboardedQuickActions', async () => {
        const mockCompleted = vi.fn();
        mockUseOnboarding.mockReturnValue([ONBOARDING_STEPS.Onboarded, vi.fn(), mockCompleted]);

        render(<GetStartedOnboarding />);

        await userEvent.click(screen.getByText('onboarded-quick-actions'));

        expect(mockCompleted).toHaveBeenCalled();
    });
});
