import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { BasicModal } from '@proton/components';
import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/api';
import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { getHasRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { CleanSendIcsActionData, INVITE_ACTION_TYPES, InviteActions } from '../../../interfaces/Invite';
import { AugmentedSendPreferences } from '../interface';

const { SEND_INVITATION, SEND_UPDATE, CHANGE_PARTSTAT, DECLINE_INVITATION, CANCEL_INVITATION, NONE } =
    INVITE_ACTION_TYPES;

const getCleanSendData = ({
    emailsWithError,
    sendPreferencesMap,
    inviteActions,
    vevent,
    cancelVevent,
}: {
    sendPreferencesMap: SimpleMap<AugmentedSendPreferences>;
    inviteActions: InviteActions;
    vevent?: VcalVeventComponent;
    cancelVevent?: VcalVeventComponent;
    emailsWithError: string[];
}) => {
    const { type, addedAttendees = [], removedAttendees = [] } = inviteActions;
    const hasAddedAttendees = !!addedAttendees.length;
    const hasRemovedAttendees = !!removedAttendees.length;
    const addedCleanAttendees = addedAttendees.filter(
        (attendee) => !emailsWithError.includes(getAttendeeEmail(attendee))
    );
    const invitedEmails = (vevent?.attendee || []).map((attendee) => getAttendeeEmail(attendee));
    const addedEmails = addedAttendees.map((attendee) => getAttendeeEmail(attendee));
    const addedEmailsWithError = addedEmails.filter((email) => emailsWithError.includes(email));
    const existingEmails = invitedEmails.filter((email) => !addedEmails.includes(email));
    const removedCleanAttendees = removedAttendees.filter(
        (attendee) => !emailsWithError.includes(getAttendeeEmail(attendee))
    );
    const removedEmails = removedAttendees.map((attendee) => getAttendeeEmail(attendee));
    const removedEmailsWithError = removedEmails.filter((email) => emailsWithError.includes(email));
    const invitedCleanAttendees = vevent?.attendee?.filter(
        (attendee) => !emailsWithError.includes(getAttendeeEmail(attendee))
    );
    const invitedCleanOfAddedAttendees = vevent?.attendee?.filter((attendee) => {
        const email = getAttendeeEmail(attendee);
        return existingEmails.includes(email) || !emailsWithError.includes(email);
    });
    const invitedEmailsWithError = (vevent?.attendee || [])
        .map((attendee) => getAttendeeEmail(attendee))
        .filter((email) => emailsWithError.includes(email));
    const cancelledCleanAttendees = cancelVevent?.attendee?.filter(
        (attendee) => !emailsWithError.includes(getAttendeeEmail(attendee))
    );
    const cancelledEmailsWithError = (cancelVevent?.attendee || [])
        .map((attendee) => getAttendeeEmail(attendee))
        .filter((email) => emailsWithError.includes(email));
    const organizerEmail = vevent?.organizer ? getAttendeeEmail(vevent.organizer) : undefined;
    const organizerEmailWithError =
        organizerEmail && emailsWithError.includes(organizerEmail) ? organizerEmail : undefined;

    const cleanData = {
        inviteActions: {
            ...inviteActions,
            addedAttendees: addedCleanAttendees,
        },
        vevent: vevent
            ? {
                  ...vevent,
                  attendee: invitedCleanOfAddedAttendees || [],
              }
            : undefined,
        cancelVevent,
        sendPreferencesMap,
        emailsWithError: [],
    };

    if (type === SEND_INVITATION) {
        if (!vevent) {
            throw new Error('Cannot create event without vevent component');
        }
        if (!hasAddedAttendees && !hasRemovedAttendees) {
            if (getHasRecurrenceId(vevent)) {
                // we're creating a single edit, in that case we want to keep attendees with errors
                return {
                    ...cleanData,
                    inviteActions: {
                        ...cleanData.inviteActions,
                    },
                    emailsWithError: [...invitedEmailsWithError, ...addedEmailsWithError, ...removedEmailsWithError],
                };
            }
            // it's a new invitation
            return {
                ...cleanData,
                vevent: {
                    ...vevent,
                    attendee: invitedCleanAttendees,
                },
                inviteActions: {
                    ...cleanData.inviteActions,
                    type: invitedCleanAttendees?.length
                        ? INVITE_ACTION_TYPES.SEND_INVITATION
                        : INVITE_ACTION_TYPES.NONE,
                },
                emailsWithError: invitedEmailsWithError,
            };
        }
        // the event exists already
        const hasAddedOrRemoved = addedCleanAttendees.length || removedCleanAttendees.length;
        return {
            ...cleanData,
            inviteActions: {
                ...cleanData.inviteActions,
                type: hasAddedOrRemoved ? SEND_INVITATION : NONE,
            },
            emailsWithError: [...addedEmailsWithError, ...removedEmailsWithError],
        };
    }
    if (type === SEND_UPDATE) {
        const cannotNotify = !invitedCleanAttendees?.length && !removedCleanAttendees?.length;
        return {
            ...cleanData,
            inviteActions: {
                ...cleanData.inviteActions,
                type: cannotNotify ? NONE : SEND_UPDATE,
            },
            emailsWithError: [...invitedEmailsWithError, ...addedEmailsWithError, ...removedEmailsWithError],
        };
    }
    if (type === CANCEL_INVITATION) {
        return {
            ...cleanData,
            inviteActions: {
                ...cleanData.inviteActions,
                type: cancelledCleanAttendees?.length ? CANCEL_INVITATION : NONE,
            },
            emailsWithError: cancelledEmailsWithError,
        };
    }
    if ([CHANGE_PARTSTAT, DECLINE_INVITATION].includes(type)) {
        return {
            sendPreferencesMap,
            inviteActions: {
                ...inviteActions,
                type: NONE,
            },
            vevent,
            cancelVevent,
            emailsWithError: [organizerEmailWithError],
        };
    }
    return cleanData;
};

const getModalContent = (
    newInviteActions: InviteActions,
    originalInviteActions: InviteActions,
    onClose: () => void,
    onSubmit: () => void
): {
    title: string;
    warningText: string;
    alertText?: string;
    submit?: React.ReactNode;
    close?: React.ReactNode;
} => {
    if (originalInviteActions.type === CHANGE_PARTSTAT) {
        if (originalInviteActions.isProtonProtonInvite) {
            // For Proton-Proton invites the answer was changed before sending the email
            return {
                title: c('Title').t`Organizer cannot be notified`,
                warningText: c('Info').t`The organizer could not be notified that you changed your answer:`,
                close: <Button className="ml-auto" color="norm" onClick={onClose}>{c('Action').t`OK`}</Button>,
            };
        }
        return {
            title: c('Title').t`Organizer cannot be notified`,
            warningText: c('Info').t`The organizer cannot be notified that you want to change your answer:`,
            close: <Button className="ml-auto" color="norm" onClick={onClose}>{c('Action').t`OK`}</Button>,
        };
    }
    if (originalInviteActions.type === DECLINE_INVITATION) {
        return {
            title: c('Title').t`Organizer cannot be notified`,
            warningText: c('Info').t`The organizer cannot be notified that you decline the invitation:`,
            alertText: c('Info').t`Would you like to delete the event anyway?`,
            submit: (
                <Button className="ml-auto" onClick={onSubmit} color="danger" type="submit">{c('Action')
                    .t`Delete`}</Button>
            ),
        };
    }
    return {
        title: c('Title').t`Participants cannot be notified`,
        warningText:
            newInviteActions.type === NONE
                ? c('Info').t`None of the participants can be notified about your changes:`
                : c('Info').t`The following participants cannot be notified about your changes:`,
        alertText: c('Info').t`Would you like to continue anyway?`,
        close: <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
        submit: <Button color="norm" onClick={onSubmit}>{c('Action').t`Continue`}</Button>,
    };
};

interface Props {
    sendPreferencesMap: SimpleMap<AugmentedSendPreferences>;
    inviteActions: InviteActions;
    vevent?: VcalVeventComponent;
    cancelVevent?: VcalVeventComponent;
    onConfirm: (data: CleanSendIcsActionData) => void;
    onClose: () => void;
    isOpen: boolean;
}
const SendWithErrorsConfirmationModal = ({
    sendPreferencesMap,
    inviteActions,
    vevent,
    cancelVevent,
    onConfirm,
    onClose,
    isOpen,
}: Props) => {
    const errorMap = Object.entries(sendPreferencesMap).reduce<SimpleMap<string>>((acc, [email, sendPrefs]) => {
        const error = sendPrefs?.error;
        if (error) {
            acc[email] = reformatApiErrorMessage(error.message);
        }
        return acc;
    }, {});
    const cleanSendData = getCleanSendData({
        emailsWithError: Object.keys(errorMap),
        sendPreferencesMap,
        inviteActions,
        vevent,
        cancelVevent,
    });
    const handleConfirm = () => {
        onConfirm(cleanSendData);
        onClose();
    };

    const renderEmailRow = (email: string) => {
        if (!cleanSendData.emailsWithError.includes(email)) {
            return null;
        }
        const error = errorMap[email];
        return (
            <li key={email}>
                <strong className="text-break">
                    {
                        // translator: the colon character needs to be translated as well because of grammar differences between languages. Example: mail@cdn.com: error (english) and mail@ndd.fr : erreur (french)
                        `${email}${c('colon').t`: `}`
                    }
                </strong>
                {error}
            </li>
        );
    };

    const { title, warningText, alertText, submit, close } = getModalContent(
        cleanSendData.inviteActions,
        inviteActions,
        onClose,
        handleConfirm
    );

    return (
        <BasicModal
            title={title}
            footer={
                (close || submit) && (
                    <>
                        {close}
                        {submit}
                    </>
                )
            }
            onSubmit={handleConfirm}
            size="large"
            fullscreenOnMobile
            onClose={onClose}
            isOpen={isOpen}
        >
            <div className="mb-4">{warningText}</div>
            <ul>{Object.keys(errorMap).map(renderEmailRow)}</ul>
            {alertText && <div>{alertText}</div>}
        </BasicModal>
    );
};

export default SendWithErrorsConfirmationModal;
