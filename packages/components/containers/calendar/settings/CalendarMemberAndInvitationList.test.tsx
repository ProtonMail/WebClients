import { render, screen } from '@testing-library/react';
import { mocked } from 'jest-mock';

import useNotifications from '@proton/components/hooks/useNotifications';
import type { CalendarMember, CalendarMemberInvitation } from '@proton/shared/lib/interfaces/calendar';
import { MEMBER_INVITATION_STATUS } from '@proton/shared/lib/interfaces/calendar';
import { mockNotifications } from '@proton/testing';

import CalendarMemberAndInvitationList from './CalendarMemberAndInvitationList';

jest.mock('@proton/components/hooks/useGetEncryptionPreferences');
jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/account/addresses/hooks');

jest.mock('../../contacts/ContactEmailsProvider', () => ({
    useContactEmailsCache: () => ({
        contactEmails: [],
        contactGroups: [],
        contactEmailsMap: {
            'member1@pm.gg': {
                Name: 'Abraham Trump',
                Email: 'member1@pm.gg',
            },
            'invitation1@pm.gg': {
                Name: 'Unknown Person',
                Email: 'invitation1@pm.gg',
            },
        },
        groupsWithContactsMap: {},
    }),
}));

const mockedUseNotifications = mocked(useNotifications);

describe('CalendarMemberAndInvitationList', () => {
    beforeEach(() => {
        mockedUseNotifications.mockImplementation(() => mockNotifications);
    });

    it(`doesn't display anything if there are no members or invitations`, () => {
        const { container } = render(
            <CalendarMemberAndInvitationList
                members={[]}
                invitations={[]}
                canEdit
                onDeleteInvitation={() => Promise.resolve()}
                onDeleteMember={() => Promise.resolve()}
                calendarID="1"
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('displays a members and invitations with available data', () => {
        const members = [
            {
                ID: 'member1',
                Email: 'member1+oops@pm.gg',
                Permissions: 96,
            },
        ] as CalendarMember[];
        const invitations = [
            {
                CalendarInvitationID: 'invitation1',
                Email: 'invitation1@pm.gg',
                // TODO: change when free/busy becomes available
                // Permissions: 64,
                Permissions: 96,
                Status: MEMBER_INVITATION_STATUS.PENDING,
            },
            {
                CalendarInvitationID: 'invitation2',
                Email: 'invitation2@pm.gg',
                Permissions: 112,
                Status: MEMBER_INVITATION_STATUS.REJECTED,
            },
        ] as CalendarMemberInvitation[];

        const { rerender } = render(
            <CalendarMemberAndInvitationList
                members={members}
                invitations={invitations}
                canEdit
                onDeleteInvitation={() => Promise.resolve()}
                onDeleteMember={() => Promise.resolve()}
                calendarID="1"
            />
        );

        expect(screen.getByText(/^AT$/)).toBeInTheDocument();
        expect(screen.getByText(/member1@pm.gg/)).toBeInTheDocument();
        expect(screen.queryByText(/member1+oops@pm.gg/)).not.toBeInTheDocument();
        // Temporary until free/busy becomes available
        // expect(screen.getByText(/See all event details/)).toBeInTheDocument();
        expect(screen.getAllByText(/See all event details/).length).toBeTruthy();

        // String is found 2 times due to responsive behaviour.
        // We need two buttons, each with the label "Remove this member"
        const removeMemberLabel = screen.getAllByText(/Remove this member/);
        expect(removeMemberLabel).toHaveLength(2);

        expect(screen.getByText(/^UP$/)).toBeInTheDocument();
        expect(screen.getByText(/invitation1@pm.gg/)).toBeInTheDocument();
        // expect(screen.getByText(/See only free\/busy/)).toBeInTheDocument();

        expect(screen.getByText(/Invite sent/)).toBeInTheDocument();

        expect(screen.getByText(/^I$/)).toBeInTheDocument();
        expect(screen.getByText(/invitation2@pm.gg/)).toBeInTheDocument();
        expect(screen.getByText(/Declined/)).toBeInTheDocument();

        expect(screen.getAllByText(/Revoke this invitation/).length).toBe(2);
        expect(screen.getAllByText(/Delete/).length).toBe(2);

        /*
         * Check cannot edit case
         * * It should be possible to remove members
         * * It shouldn't be possible to edit permissions
         */
        rerender(
            <CalendarMemberAndInvitationList
                members={members}
                invitations={invitations}
                canEdit={false}
                onDeleteInvitation={() => Promise.resolve()}
                onDeleteMember={() => Promise.resolve()}
                calendarID="1"
            />
        );

        const changePermissionsButtons = screen.getAllByRole('button', { name: /See all event details|Edit/ });
        changePermissionsButtons.forEach((button) => {
            expect(button).toBeDisabled();
        });
        const removeThisMemberButtons = screen.getAllByRole('button', { name: /Remove this member/ });
        removeThisMemberButtons.forEach((button) => {
            expect(button).not.toBeDisabled();
        });
    });
});
