import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AlertModal,
    ModalProps,
    useCalendarShareInvitationActions,
    useLoading,
    useNotifications,
    useSettingsLink,
} from '@proton/components';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { CALENDAR_TYPE_EXTENDED } from '@proton/shared/lib/calendar/constants';
import getHasUserReachedCalendarsLimit from '@proton/shared/lib/calendar/getHasUserReachedCalendarsLimit';
import { APPS } from '@proton/shared/lib/constants';
import { getIsAddressDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { CalendarMemberInvitation, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

export interface SharedCalendarModalOwnProps {
    addresses: Address[];
    calendars: VisualCalendar[];
    user: UserModel;
    invitation: CalendarMemberInvitation;
}

interface Props extends ModalProps, SharedCalendarModalOwnProps {}

const ShareCalendarInvitationModal = ({ addresses, calendars, user, invitation, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { contactEmailsMap } = useContactEmailsCache();
    const goToSettings = useSettingsLink();
    const [loadingAccept, withLoadingAccept] = useLoading();
    const [loadingReject, withLoadingReject] = useLoading();
    const { accept, reject } = useCalendarShareInvitationActions();

    const canonicalizedInvitedEmail = canonicalizeInternalEmail(invitation.Email);
    const invitedAddress = addresses.find(
        ({ Email }) => canonicalizeInternalEmail(Email) === canonicalizedInvitedEmail
    );

    if (!invitedAddress) {
        createNotification({
            type: 'error',
            text: c('Error accepting calendar invitation').t`Invited address does not exist`,
        });
        return null;
    }

    const calendarOwnerEmail = invitation.Calendar.SenderEmail;
    const calendarName = invitation.Calendar.Name;
    const isInvitedAddressDisabled = getIsAddressDisabled(invitedAddress);
    const { isPersonalCalendarsLimitReached, isSharedCalendarsLimitReached } = getHasUserReachedCalendarsLimit({
        calendars,
        isFreeUser: !user.hasPaidMail,
    });
    const isCalendarsLimitReached = isPersonalCalendarsLimitReached || isSharedCalendarsLimitReached;

    const handleAccept = () => withLoadingAccept(accept(invitation, rest.onClose));
    const handleReject = () => withLoadingReject(reject(invitation, rest.onClose));
    const handleGoToSettings = () => goToSettings('/identity-addresses', APPS.PROTONMAIL);

    const calendarOwnerDisplayName = (
        <span key="calendar-owner" className="text-break">
            {contactEmailsMap[calendarOwnerEmail]?.Name || calendarOwnerEmail}
        </span>
    );
    const boldCalendarName = (
        <span key="bold-calendar-name" className="text-bold text-break">
            {calendarName}
        </span>
    );
    const boldCalendarOwnerEmail = (
        <span key="bold-calendar-owner-email" className="text-bold text-break">
            {calendarOwnerEmail}
        </span>
    );
    const boldInvitedAddress = (
        <span key="bold-invited-address" className="text-bold text-break">
            {invitation.Email}
        </span>
    );

    if (isCalendarsLimitReached && !isInvitedAddressDisabled) {
        return <CalendarLimitReachedModal {...rest} calendarType={CALENDAR_TYPE_EXTENDED.SHARED} />;
    }

    const title = isInvitedAddressDisabled
        ? c('Modal for received invitation to share calendar; Title').t`Unable to join more calendars`
        : c('Modal for received invitation to share calendar; Title').t`Join calendar`;
    const buttons: [JSX.Element, JSX.Element] = isInvitedAddressDisabled
        ? [
              <Button type="submit" color="norm" onClick={handleGoToSettings}>
                  {c('Action').t`Manage addresses`}
              </Button>,
              <Button onClick={handleReject} loading={loadingReject}>
                  {c('Action').t`Decline invite`}
              </Button>,
          ]
        : [
              <Button type="submit" color="norm" onClick={handleAccept} loading={loadingAccept}>
                  {c('Action').t`Join calendar`}
              </Button>,
              <Button onClick={handleReject} loading={loadingReject}>
                  {c('Action').t`No, thanks`}
              </Button>,
          ];

    return (
        <AlertModal {...rest} title={title} buttons={buttons}>
            {isInvitedAddressDisabled ? (
                <>
                    <p>
                        {c('Warning in modal to accept calendar invitation; Description')
                            .jt`You cannot join this calendar because your invited email address (${boldInvitedAddress}) is disabled.`}
                    </p>
                    <p>
                        {c('Warning in modal to accept calendar invitation; Description')
                            .jt`To access this shared calendar, enable this address, or ask ${boldCalendarOwnerEmail} to send an invite to an active address.`}
                    </p>
                </>
            ) : (
                <p>
                    {c('Modal for received invitation to share calendar; text')
                        .jt`${calendarOwnerDisplayName} shared their calendar ${boldCalendarName} with you.`}
                </p>
            )}
        </AlertModal>
    );
};

export default ShareCalendarInvitationModal;
