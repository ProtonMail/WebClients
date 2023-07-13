import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    ModalProps,
    Prompt,
    useCalendarShareInvitationActions,
    useModalState,
    useNotifications,
    useSettingsLink,
} from '@proton/components';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import ShareCalendarWithSignatureVerificationErrorModal from '@proton/components/containers/calendar/shareProton/ShareCalendarWithSignatureVerificationErrorModal';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { useLoading } from '@proton/hooks';
import { getHasUserReachedCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import { ShareCalendarSignatureVerificationError } from '@proton/shared/lib/calendar/sharing/shareProton/ShareCalendarSignatureVerificationError';
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
    const [
        signatureVerificationErrorModal,
        setIsSignatureVerificationErrorModalOpen,
        renderSignatureVerificationErrorModal,
    ] = useModalState();

    const canonicalizedInvitedEmail = canonicalizeInternalEmail(invitation.Email);
    const invitedAddress = addresses.find(
        ({ Email }) => canonicalizeInternalEmail(Email) === canonicalizedInvitedEmail
    );
    const isFreeUser = !user.hasPaidMail;

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
    const { isOtherCalendarsLimitReached } = getHasUserReachedCalendarsLimit(calendars, isFreeUser);

    const handleAcceptError = (e: Error) => {
        if (e instanceof ShareCalendarSignatureVerificationError) {
            const { errors } = e;
            errors?.forEach((error) => {
                console.error(error);
            });
            setIsSignatureVerificationErrorModalOpen(true);
        } else {
            createNotification({
                type: 'error',
                text: e.message,
            });
        }
    };
    const handleRejectError = (e: Error) => {
        createNotification({
            type: 'error',
            text: e.message,
        });
        rest.onClose?.();
    };

    const handleAccept = () =>
        withLoadingAccept(
            accept({
                invitation,
                onFinish: rest.onClose,
                onError: handleAcceptError,
            })
        );

    const handleReject = () =>
        withLoadingReject(
            reject({
                invitation,
                onFinish: rest.onClose,
                onError: handleRejectError,
            })
        );
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

    if (isOtherCalendarsLimitReached && !isInvitedAddressDisabled) {
        return <CalendarLimitReachedModal {...rest} isFreeUser={isFreeUser} />;
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
        <>
            {renderSignatureVerificationErrorModal && (
                <ShareCalendarWithSignatureVerificationErrorModal
                    {...signatureVerificationErrorModal}
                    senderEmail={calendarOwnerEmail}
                    onCancel={() => {
                        signatureVerificationErrorModal.onClose();
                        rest.onClose?.();
                    }}
                />
            )}
            <Prompt {...rest} title={title} buttons={buttons}>
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
            </Prompt>
        </>
    );
};

export default ShareCalendarInvitationModal;
