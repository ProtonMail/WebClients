import { c, msgid } from 'ttag';

import { Alert } from '@proton/components/components';
import { useApi, useNotifications } from '@proton/components/hooks';
import { updateInvitation, updateMember } from '@proton/shared/lib/api/calendars';
import { MAX_CALENDAR_MEMBERS } from '@proton/shared/lib/calendar/constants';
import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import {
    CalendarMember,
    CalendarMemberInvitation,
    MEMBER_INVITATION_STATUS,
} from '@proton/shared/lib/interfaces/calendar';

import { useContactEmailsCache } from '../../contacts/ContactEmailsProvider';
import CalendarMemberRow from './CalendarMemberRow';

interface MemberAndInvitationListProps {
    members: CalendarMember[];
    invitations: CalendarMemberInvitation[];
    calendarID: string;
    onDeleteMember: (id: string) => Promise<void>;
    onDeleteInvitation: (id: string, isDeclined: boolean) => Promise<void>;
}

const CalendarMemberAndInvitationList = ({
    members,
    invitations,
    calendarID,
    onDeleteMember,
    onDeleteInvitation,
}: MemberAndInvitationListProps) => {
    const { contactEmailsMap } = useContactEmailsCache();
    const { createNotification } = useNotifications();
    const api = useApi();

    if (!members.length && !invitations.length) {
        return null;
    }

    const showPermissionChangeSuccessNotification = (email: string) => {
        createNotification({
            type: 'info',
            text: c('Calendar sharing permission change notification').t`Permissions changed for ${email}`,
        });
    };

    const shouldDisplayStatus = invitations.some(({ Status }) =>
        [MEMBER_INVITATION_STATUS.REJECTED, MEMBER_INVITATION_STATUS.PENDING].includes(Status)
    );
    const shouldDisplayPermissions = invitations.some(({ Status }) => Status !== MEMBER_INVITATION_STATUS.REJECTED);

    return (
        <>
            {members.length + invitations.length === MAX_CALENDAR_MEMBERS && (
                <Alert type="warning" className="mb0-75">
                    {c('Maximum shared calendar members reached alert').ngettext(
                        msgid`You have reached the maximum of ${MAX_CALENDAR_MEMBERS} member.`,
                        `You have reached the maximum of ${MAX_CALENDAR_MEMBERS} members.`,
                        MAX_CALENDAR_MEMBERS
                    )}
                </Alert>
            )}
            <div className="calendar-members-grid">
                {[
                    c('Header').t`User`,
                    shouldDisplayPermissions ? c('Header').t`Permissions` : '',
                    shouldDisplayStatus ? c('Header').t`Status` : '',
                    c('Header').t`Action`,
                ].map((text, index) => (
                    <div className="text-bold" style={index === 0 ? { gridColumn: '1 / 3' } : undefined}>
                        {text}
                    </div>
                ))}
                {members.map(({ ID, Email, Permissions }) => {
                    const { Name: contactName, Email: contactEmail } = contactEmailsMap[
                        canonizeInternalEmail(Email)
                    ] || {
                        Name: Email,
                        Email,
                    };

                    return (
                        <CalendarMemberRow
                            key={ID}
                            onDelete={() => onDeleteMember(ID)}
                            onPermissionsUpdate={async (newPermissions) => {
                                await api(updateMember(calendarID, ID, { Permissions: newPermissions }));
                                showPermissionChangeSuccessNotification(contactEmail);
                            }}
                            name={contactName}
                            email={contactEmail}
                            deleteLabel={c('Action').t`Remove this member`}
                            permissions={Permissions}
                        />
                    );
                })}
                {invitations.map(({ CalendarInvitationID, Email, Permissions, Status }) => {
                    if (Status === MEMBER_INVITATION_STATUS.ACCEPTED) {
                        return null;
                    }

                    const { Name: contactName, Email: contactEmail } = contactEmailsMap[
                        canonizeInternalEmail(Email)
                    ] || {
                        Name: Email,
                        Email,
                    };
                    const isDeclined = Status === MEMBER_INVITATION_STATUS.REJECTED;
                    const deleteLabel = isDeclined ? c('Action').t`Delete` : c('Action').t`Revoke this invitation`;

                    return (
                        <CalendarMemberRow
                            key={CalendarInvitationID}
                            onDelete={() => onDeleteInvitation(CalendarInvitationID, isDeclined)}
                            onPermissionsUpdate={async (newPermissions) => {
                                await api(
                                    updateInvitation(calendarID, CalendarInvitationID, {
                                        Permissions: newPermissions,
                                    })
                                );
                                showPermissionChangeSuccessNotification(contactEmail);
                            }}
                            name={contactName}
                            email={contactEmail}
                            deleteLabel={deleteLabel}
                            permissions={Permissions}
                            status={Status}
                        />
                    );
                })}
            </div>
        </>
    );
};

export default CalendarMemberAndInvitationList;
