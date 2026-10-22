import { fireEvent, render, screen, within } from '@testing-library/react';

import { ItemStatus, Phase } from '@proton/account/scimSetup';
import type { Group } from '@proton/shared/lib/interfaces/Group';
import type { EnhancedMember, MemberReadyForManualUnprivatization } from '@proton/shared/lib/interfaces/Member';

import ScimSetupModal from './ScimSetupModal';

jest.mock('@proton/atoms/Portal/Portal');
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: () => true }));

let mockIsScimEnabled = true;
jest.mock('@proton/account/organization/hooks', () => ({
    useOrganization: () => [{ IsScimEnabled: mockIsScimEnabled }],
}));

const getCleanUp = (ID: string, Name: string, Email: string, status = ItemStatus.Unknown) => ({
    member: { ID, Name, Addresses: [{ Email }] } as unknown as EnhancedMember,
    status,
});

const getUser = (ID: string, status = ItemStatus.Unknown) => ({
    member: { ID, Name: `User ${ID}`, Addresses: [] } as unknown as MemberReadyForManualUnprivatization,
    status,
});

const getGroup = (ID: string, status = ItemStatus.Unknown) => ({
    group: { ID, Name: `Group ${ID}`, Address: { HasKeys: true } } as unknown as Group,
    members: [],
    status,
});

const renderModal = (props: Partial<Parameters<typeof ScimSetupModal>[0]> = {}) => {
    const onFinish = jest.fn();
    render(
        <ScimSetupModal
            open
            users={[]}
            groups={[]}
            cleanUps={[]}
            pendingMembers={{}}
            phase={Phase.Idle}
            onFinish={onFinish}
            onClose={jest.fn()}
            {...props}
        />
    );
    return { onFinish };
};

const ava = getCleanUp('1', 'Ava Thompson', 'ava.thompson@mycompany.com');
const eva = getCleanUp('2', 'Eva Simpson', 'eva.simpson@mycompany.com');

describe('ScimSetupModal', () => {
    describe('clean up section', () => {
        it('is not rendered when only users are pending', () => {
            renderModal({ users: [getUser('1')] });

            expect(screen.getByText('1 user synced')).toBeInTheDocument();
            expect(screen.queryByText(/clean up action/)).not.toBeInTheDocument();
        });

        it('renders on its own with a singular heading', () => {
            renderModal({ cleanUps: [ava] });

            expect(screen.getByText('1 clean up action required')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
        });

        it('lists members with initials, name, email and what approving will do', () => {
            renderModal({ cleanUps: [ava, eva] });

            fireEvent.click(screen.getByText('2 clean up actions required'));

            expect(screen.getByText('AT')).toBeInTheDocument();
            expect(screen.getByText('Ava Thompson')).toBeInTheDocument();
            expect(screen.getByText('ava.thompson@mycompany.com')).toBeInTheDocument();
            expect(screen.getByText('ES')).toBeInTheDocument();
            expect(screen.getByText('Eva Simpson')).toBeInTheDocument();
            expect(screen.getByText('eva.simpson@mycompany.com')).toBeInTheDocument();
            expect(screen.getAllByText('remove organization key')).toHaveLength(2);
        });

        it('collapses and expands', () => {
            renderModal({ cleanUps: [ava] });
            const heading = screen.getByText('1 clean up action required');

            fireEvent.click(heading);
            expect(screen.getByText('Ava Thompson')).toBeInTheDocument();

            fireEvent.click(heading);
            expect(screen.queryByText('Ava Thompson')).not.toBeInTheDocument();
        });

        it('replaces the badge with the row status once there is one', () => {
            renderModal({
                cleanUps: [
                    getCleanUp('1', 'Ava Thompson', 'ava@mycompany.com', ItemStatus.Scheduled),
                    getCleanUp('2', 'Eva Simpson', 'eva@mycompany.com', ItemStatus.Failed),
                ],
            });

            fireEvent.click(screen.getByText('2 clean up actions required'));

            expect(screen.queryByText('remove organization key')).not.toBeInTheDocument();
            expect(screen.getByText('key removal scheduled')).toBeInTheDocument();
            expect(screen.getByText('failed')).toBeInTheDocument();
        });

        it('calls onFinish on approve', () => {
            const { onFinish } = renderModal({ cleanUps: [ava] });

            fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

            expect(onFinish).toHaveBeenCalledTimes(1);
        });
    });

    describe('section status', () => {
        const getSectionBadge = (heading: string) => within(screen.getByText(heading).closest('button')!);

        it('surfaces a failed row when collapsed', () => {
            renderModal({
                cleanUps: [
                    getCleanUp('1', 'Ava Thompson', 'ava@mycompany.com', ItemStatus.Completed),
                    getCleanUp('2', 'Eva Simpson', 'eva@mycompany.com', ItemStatus.Failed),
                ],
            });

            expect(getSectionBadge('2 clean up actions required').getByText('failed')).toBeInTheDocument();
        });

        it('keeps pending rows ahead of failed ones', () => {
            renderModal({
                cleanUps: [
                    getCleanUp('1', 'Ava Thompson', 'ava@mycompany.com', ItemStatus.Finalizing),
                    getCleanUp('2', 'Eva Simpson', 'eva@mycompany.com', ItemStatus.Failed),
                ],
            });

            const section = getSectionBadge('2 clean up actions required');
            expect(section.getByText('finalizing')).toBeInTheDocument();
            expect(section.queryByText('failed')).not.toBeInTheDocument();
        });

        it('is scheduled when every row is scheduled or completed', () => {
            renderModal({
                cleanUps: [
                    getCleanUp('1', 'Ava Thompson', 'ava@mycompany.com', ItemStatus.Scheduled),
                    getCleanUp('2', 'Eva Simpson', 'eva@mycompany.com', ItemStatus.Completed),
                ],
            });

            expect(
                getSectionBadge('2 clean up actions required').getByText('key removal scheduled')
            ).toBeInTheDocument();
        });

        it('keeps failed rows ahead of scheduled ones', () => {
            renderModal({
                cleanUps: [
                    getCleanUp('1', 'Ava Thompson', 'ava@mycompany.com', ItemStatus.Scheduled),
                    getCleanUp('2', 'Eva Simpson', 'eva@mycompany.com', ItemStatus.Failed),
                ],
            });

            const section = getSectionBadge('2 clean up actions required');
            expect(section.getByText('failed')).toBeInTheDocument();
            expect(section.queryByText('key removal scheduled')).not.toBeInTheDocument();
        });

        it('is completed when every row is', () => {
            renderModal({ users: [getUser('1', ItemStatus.Completed), getUser('2', ItemStatus.Completed)] });

            expect(getSectionBadge('2 users synced').getByText('completed')).toBeInTheDocument();
        });

        it('shows nothing for a mix of completed and unknown rows', () => {
            renderModal({ groups: [getGroup('1', ItemStatus.Completed), getGroup('2', ItemStatus.Unknown)] });

            const section = getSectionBadge('2 groups synced');
            expect(section.queryByText('completed')).not.toBeInTheDocument();
            expect(section.queryByText('failed')).not.toBeInTheDocument();
        });
    });

    describe('headings', () => {
        it.each([
            [1, '1 user synced', '1 group synced'],
            [3, '3 users synced', '3 groups synced'],
        ])('pluralise users and groups for %i', (count, usersHeading, groupsHeading) => {
            renderModal({
                users: Array.from({ length: count }, (_, index) => getUser(`${index}`)),
                groups: Array.from({ length: count }, (_, index) => getGroup(`${index}`)),
            });

            expect(screen.getByText(usersHeading)).toBeInTheDocument();
            expect(screen.getByText(groupsHeading)).toBeInTheDocument();
        });
    });

    describe('without SCIM', () => {
        const scimTexts = [
            'Review users and groups before finishing setup',
            'From your identity provider',
            "Users set to private need to accept the invite to finish setup. We'll send them an invite once you approve.",
        ];

        beforeEach(() => {
            mockIsScimEnabled = false;
        });

        afterEach(() => {
            mockIsScimEnabled = true;
        });

        it('hides the identity provider copy when only clean-ups are pending', () => {
            renderModal({ cleanUps: [ava] });

            expect(screen.getByText('1 clean up action required')).toBeInTheDocument();
            scimTexts.forEach((text) => expect(screen.queryByText(text)).not.toBeInTheDocument());
        });

        it('keeps the identity provider copy while users are pending', () => {
            renderModal({ users: [getUser('1')], cleanUps: [ava] });

            scimTexts.forEach((text) => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
        });
    });
});
