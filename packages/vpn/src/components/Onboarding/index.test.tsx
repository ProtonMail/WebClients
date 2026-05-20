import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useOrganization } from '@proton/account/organization/hooks';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';

import { useOnOrganizationNameSetup } from '../../hooks/useOnOrganizationNameSetup';
import { useOnboarding } from '../../hooks/useOnboarding';
import { ONBOARDING } from '../../types/Onboarding';
import { GetStartedOnboarding } from './index';

jest.mock('@proton/account/organization/hooks', () => ({
    useOrganization: jest.fn(),
}));

jest.mock('@proton/components/containers/organization/SetupOrganizationNameModal', () => ({
    SetupOrganizationNameModal: ({ onSubmit, open }: { onSubmit: (name: string) => void; open: boolean }) =>
        open ? <button onClick={() => onSubmit('My Org')}>setup-org-modal</button> : null,
}));

jest.mock('@proton/components/hooks/useNotifications', () =>
    jest.fn().mockReturnValue({
        createNotification: jest.fn(),
    })
);

jest.mock('@proton/components/components/link/useSettingsLink', () => jest.fn());

jest.mock('../../hooks/useOnOrganizationNameSetup', () => ({
    useOnOrganizationNameSetup: jest.fn(),
}));

jest.mock('../../hooks/useOnboarding', () => ({
    useOnboarding: jest.fn(),
}));

jest.mock('@proton/components/components/topnavbar/GetStartedButton', () => ({
    GetStartedButton: ({ onDismiss }: { onDismiss: () => void }) => (
        <button onClick={onDismiss}>get-started-button</button>
    ),
}));

jest.mock('./OnboardedQuickActions', () => ({
    OnboardedQuickActions: ({ onDismiss }: { onDismiss: () => void }) => (
        <button onClick={onDismiss}>onboarded-quick-actions</button>
    ),
}));

const mockUseOrganization = useOrganization as jest.MockedFunction<typeof useOrganization>;
const mockUseSettingsLink = useSettingsLink as jest.MockedFunction<typeof useSettingsLink>;
const mockUseOnOrganizationNameSetup = useOnOrganizationNameSetup as jest.MockedFunction<
    typeof useOnOrganizationNameSetup
>;
const mockUseOnboarding = useOnboarding as jest.MockedFunction<typeof useOnboarding>;

const mockOrganization = { Name: 'Test Org' } as ReturnType<typeof useOrganization>[0];

describe('GetStartedOnboarding', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseOrganization.mockReturnValue([mockOrganization, false]);
        mockUseSettingsLink.mockReturnValue(jest.fn());
        mockUseOnOrganizationNameSetup.mockReturnValue(jest.fn());
        mockUseOnboarding.mockReturnValue([ONBOARDING.Onboarded, jest.fn(), jest.fn()]);
    });

    it('renders nothing when there is no organization', () => {
        mockUseOrganization.mockReturnValue([undefined, false]);

        const { container } = render(<GetStartedOnboarding />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders SetupOrganizationNameModal when not onboarded', () => {
        mockUseOnboarding.mockReturnValue([ONBOARDING.NotOnboarded, jest.fn(), jest.fn()]);

        render(<GetStartedOnboarding />);

        expect(screen.getByText('setup-org-modal')).toBeInTheDocument();
    });

    it('renders OnboardedQuickActions when onboarded', () => {
        render(<GetStartedOnboarding />);

        expect(screen.getByText('onboarded-quick-actions')).toBeInTheDocument();
    });

    it('renders nothing when not eligible', () => {
        mockUseOnboarding.mockReturnValue([ONBOARDING.NotEligible, jest.fn(), jest.fn()]);

        const { container } = render(<GetStartedOnboarding />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when dismissed', () => {
        mockUseOnboarding.mockReturnValue([ONBOARDING.Dismissed, jest.fn(), jest.fn()]);

        const { container } = render(<GetStartedOnboarding />);

        expect(container).toBeEmptyDOMElement();
    });

    it('calls onOrganizationNameSetup with submitted name, then onboarded, then navigates', async () => {
        const mockOnboarded = jest.fn().mockResolvedValue(undefined);
        const mockOnOrganizationNameSetup = jest.fn().mockResolvedValue(undefined);
        const mockGoToSettings = jest.fn();

        mockUseOnboarding.mockReturnValue([ONBOARDING.NotOnboarded, mockOnboarded, jest.fn()]);
        mockUseOnOrganizationNameSetup.mockReturnValue(mockOnOrganizationNameSetup);
        mockUseSettingsLink.mockReturnValue(mockGoToSettings);

        render(<GetStartedOnboarding />);

        await userEvent.click(screen.getByText('setup-org-modal'));

        expect(mockOnOrganizationNameSetup).toHaveBeenCalledWith('My Org');
        await waitFor(() => expect(mockOnboarded).toHaveBeenCalled());
        await waitFor(() => expect(mockGoToSettings).toHaveBeenCalledWith('/users-addresses'));
    });

    it('passes completed as onDismiss to OnboardedQuickActions', async () => {
        const mockCompleted = jest.fn();
        mockUseOnboarding.mockReturnValue([ONBOARDING.Onboarded, jest.fn(), mockCompleted]);

        render(<GetStartedOnboarding />);

        await userEvent.click(screen.getByText('onboarded-quick-actions'));

        expect(mockCompleted).toHaveBeenCalled();
    });
});
