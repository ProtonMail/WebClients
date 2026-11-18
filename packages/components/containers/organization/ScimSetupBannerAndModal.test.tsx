import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockedFunction } from 'vitest';

import { useFlag } from '@proton/unleash/useFlag';

import ScimSetupBannerAndModal from './ScimSetupBannerAndModal';
import useScimSetupData from './useScimSetupData';

vi.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as MockedFunction<any>;

vi.mock('@proton/account/organization/hooks', () => ({ useOrganization: () => [{ IsScimEnabled: true }] }));

vi.mock('./useScimSetupData', async () => ({
    ...(await vi.importActual('./useScimSetupData')),
    __esModule: true,
    default: vi.fn(),
}));
const mockUseScimSetupData = useScimSetupData as MockedFunction<any>;

vi.mock('./ScimSetupModal', () => ({
    __esModule: true,
    default: ({ open }: { open?: boolean }) => (open ? <div data-testid="scim-setup-modal" /> : null),
}));

const getScimSetupData = (overrides: Record<string, unknown> = {}) => ({
    isEnabled: true,
    phase: undefined,
    pendingUsers: [],
    pendingGroups: [],
    pendingMembersByGroup: {},
    membersRequiringOrgKeyDemotion: [],
    userStatuses: {},
    groupStatuses: {},
    groupMemberStatuses: {},
    approvePendingChanges: vi.fn(),
    orgKeyDemotionStatuses: {},
    resetApproval: vi.fn(),
    ...overrides,
});

describe('ScimSetupBannerAndModal', () => {
    beforeEach(() => {
        mockUseFlag.mockReturnValue(true);
    });

    it('renders nothing when nothing is outstanding', () => {
        mockUseScimSetupData.mockReturnValue(getScimSetupData());

        const { container } = render(<ScimSetupBannerAndModal />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the banner for clean-up actions only and opens the modal on review', async () => {
        mockUseScimSetupData.mockReturnValue(
            getScimSetupData({ membersRequiringOrgKeyDemotion: [{ ID: 'member-1' }, { ID: 'member-2' }] })
        );

        render(<ScimSetupBannerAndModal />);

        expect(screen.getByText(/2 clean up actions required\./)).toBeInTheDocument();
        expect(screen.queryByTestId('scim-setup-modal')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Review changes' }));

        expect(screen.getByTestId('scim-setup-modal')).toBeInTheDocument();
    });
});
