import { render, screen } from '@testing-library/react';

import { useFlag } from '@proton/unleash/useFlag';

import ScimSetupBanner from './ScimSetupBanner';

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.MockedFunction<any>;

let mockIsScimEnabled = true;
jest.mock('@proton/account/organization/hooks', () => ({
    useOrganization: () => [{ IsScimEnabled: mockIsScimEnabled }],
}));

const renderBanner = (counts: { pendingUsersCount?: number; pendingGroupsCount?: number; cleanUpCount?: number }) =>
    render(
        <ScimSetupBanner
            pendingUsersCount={counts.pendingUsersCount ?? 0}
            pendingGroupsCount={counts.pendingGroupsCount ?? 0}
            cleanUpCount={counts.cleanUpCount ?? 0}
            onReviewChanges={jest.fn()}
        />
    );

const grantAccessText = 'Final approval needed to grant access across all Proton services.';
const removeKeyAccessText = 'Final approval needed to remove organization key access.';

describe('ScimSetupBanner', () => {
    beforeEach(() => {
        mockUseFlag.mockReturnValue(true);
        mockIsScimEnabled = true;
    });

    it('renders nothing when nothing is outstanding', () => {
        const { container } = renderBanner({});

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when UserGroupsScimGroups is off', () => {
        mockUseFlag.mockReturnValue(false);

        const { container } = renderBanner({ pendingUsersCount: 2, pendingGroupsCount: 1, cleanUpCount: 3 });

        expect(container).toBeEmptyDOMElement();
    });

    it.each([
        [1, `1 clean up action required. ${removeKeyAccessText}`],
        [2, `2 clean up actions required. ${removeKeyAccessText}`],
    ])('renders clean-up only copy for %i action(s)', (cleanUpCount, expected) => {
        renderBanner({ cleanUpCount });

        expect(screen.getByText(expected)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Review changes' })).toBeInTheDocument();
    });

    it.each([
        [{ pendingUsersCount: 1 }, `1 user synced. ${grantAccessText}`],
        [{ pendingUsersCount: 2 }, `2 users synced. ${grantAccessText}`],
        [{ pendingGroupsCount: 1 }, `1 group synced. ${grantAccessText}`],
        [{ pendingGroupsCount: 3 }, `3 groups synced. ${grantAccessText}`],
        [{ pendingUsersCount: 2, pendingGroupsCount: 1 }, `2 users and 1 group synced. ${grantAccessText}`],
    ])('renders unchanged copy without clean-up actions (%o)', (counts, expected) => {
        renderBanner(counts);

        expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it.each([
        [{ pendingUsersCount: 1, cleanUpCount: 1 }, `1 user synced. 1 clean up action required. ${grantAccessText}`],
        [
            { pendingGroupsCount: 2, cleanUpCount: 3 },
            `2 groups synced. 3 clean up actions required. ${grantAccessText}`,
        ],
        [
            { pendingUsersCount: 2, pendingGroupsCount: 1, cleanUpCount: 2 },
            `2 users and 1 group synced. 2 clean up actions required. ${grantAccessText}`,
        ],
    ])('renders a single banner combining synced items and clean-up actions (%o)', (counts, expected) => {
        renderBanner(counts);

        expect(screen.getByText(expected)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Review changes' })).toHaveLength(1);
    });

    describe('without SCIM', () => {
        beforeEach(() => {
            mockIsScimEnabled = false;
        });

        it.each([
            [1, "1 user's permissions have changed. Final approval needed to revoke their organization keys."],
            [3, "3 users' permissions have changed. Final approval needed to revoke their organization keys."],
        ])('describes %i clean-up action(s) as permission changes, without the SCIM link', (cleanUpCount, expected) => {
            renderBanner({ cleanUpCount });

            expect(screen.getByText('Approve permission changes for your organization')).toBeInTheDocument();
            expect(screen.getByText(expected)).toBeInTheDocument();
            expect(screen.queryByText('Learn more')).not.toBeInTheDocument();
        });

        it('keeps the identity provider copy while users are pending', () => {
            renderBanner({ pendingUsersCount: 1, cleanUpCount: 1 });

            expect(screen.getByText('Approve changes from your identity provider')).toBeInTheDocument();
            expect(
                screen.getByText(`1 user synced. 1 clean up action required. ${grantAccessText}`)
            ).toBeInTheDocument();
            expect(screen.getByText('Learn more')).toBeInTheDocument();
        });
    });
});
