import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AlwaysOnPolicy } from '../../types/AlwaysOn';
import { AlwaysOn } from './AlwaysOn';

const fetchPolicy = vi.fn();
const updatePolicy = vi.fn();
const service = { fetchPolicy, updatePolicy };

vi.mock('@proton/components/hooks/useApi', () => ({ default: vi.fn() }));
vi.mock('../../services/alwaysOnPolicyService', () => ({
    getAlwaysOnPolicyService: () => service,
}));

const flagMock = vi.fn();
vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => flagMock(),
    default: () => flagMock(),
}));

vi.mock('@proton/components/hooks/useNotifications', () => ({
    default: () => ({ createNotification: vi.fn() }),
}));

const buildPolicy = (overrides: Partial<AlwaysOnPolicy> = {}): AlwaysOnPolicy => ({
    ID: 'policy-1',
    EnforceAlwaysOn: true,
    RestrictLogins: false,
    Version: 1,
    Hash: 'a'.repeat(64),
    UpdatedAt: 1_750_000_000,
    CreatorUserID: 'user-1',
    Artifacts: {
        windows: { Filename: 'protonvpn-install-abc.ps1', Content: '# installer' },
        rego: { Filename: 'protonvpn-deviceprofile.rego', Content: 'package protonvpn' },
    },
    ...overrides,
});

describe('AlwaysOn', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        flagMock.mockReturnValue(true);
        fetchPolicy.mockResolvedValue(null);
        updatePolicy.mockResolvedValue(buildPolicy());
    });

    it('renders nothing when the feature flag is off', () => {
        flagMock.mockReturnValue(false);

        const { container } = render(<AlwaysOn />);

        expect(container).toBeEmptyDOMElement();
    });

    it('shows the call-to-action when no policy is configured', async () => {
        fetchPolicy.mockResolvedValue(null);

        render(<AlwaysOn />);

        expect(await screen.findByText('Ensure your organization is always protected')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Configure Always-on VPN' })).toBeInTheDocument();
    });

    it('shows the overview reflecting the policy when one is configured', async () => {
        fetchPolicy.mockResolvedValue(buildPolicy({ EnforceAlwaysOn: true, RestrictLogins: true }));

        render(<AlwaysOn />);

        expect(await screen.findByText('Always-on VPN device profile')).toBeInTheDocument();
        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByText('Restricted to members of your organization')).toBeInTheDocument();
    });

    it('shows "Disabled" / "No restrictions" for a configured-but-off policy', async () => {
        fetchPolicy.mockResolvedValue(buildPolicy({ EnforceAlwaysOn: false, RestrictLogins: false }));

        render(<AlwaysOn />);

        expect(await screen.findByText('Disabled')).toBeInTheDocument();
        expect(screen.getByText('No restrictions')).toBeInTheDocument();
    });

    it('opens the deployment instructions from the overview', async () => {
        fetchPolicy.mockResolvedValue(buildPolicy());

        render(<AlwaysOn />);
        await screen.findByText('Always-on VPN device profile');

        await userEvent.click(screen.getByRole('button', { name: 'Instructions' }));

        expect(await screen.findByText('Choose a deployment method')).toBeInTheDocument();
    });

    it('runs the create flow and commits the policy to the page when the modal reaches the instructions step', async () => {
        render(<AlwaysOn />);

        await userEvent.click(await screen.findByRole('button', { name: 'Configure Always-on VPN' }));
        await userEvent.click(await screen.findByText('Generate device profile'));

        expect(updatePolicy).toHaveBeenCalledWith({ EnforceAlwaysOn: true, RestrictLogins: false });

        expect(await screen.findByText('Choose a deployment method', undefined, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getByText('Done')).toBeInTheDocument();
        expect(screen.getByText('Always-on VPN device profile')).toBeInTheDocument();
    });

    it('sends RestrictLogins=true when the optional restriction is checked', async () => {
        render(<AlwaysOn />);

        await userEvent.click(await screen.findByRole('button', { name: 'Configure Always-on VPN' }));
        await userEvent.click(await screen.findByText('Restrict logins to your organization'));
        await userEvent.click(screen.getByText('Generate device profile'));

        await waitFor(
            () => expect(updatePolicy).toHaveBeenCalledWith({ EnforceAlwaysOn: true, RestrictLogins: true }),
            { timeout: 2000 }
        );
    });

    it('keeps showing the call-to-action when the policy fetch fails', async () => {
        fetchPolicy.mockRejectedValue(new Error('network'));

        render(<AlwaysOn />);

        expect(await screen.findByText('Ensure your organization is always protected')).toBeInTheDocument();
    });
});
