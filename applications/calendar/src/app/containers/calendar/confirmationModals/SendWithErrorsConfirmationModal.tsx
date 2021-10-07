import { getAttendeeEmail } from '@proton/shared/lib/calendar/attendees';
import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/helper';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import * as React from 'react';
import { Alert, ErrorButton, FormModal } from '@proton/components';
import { c } from 'ttag';
import { CleanSendIcsActionData, INVITE_ACTION_TYPES, InviteActions } from '../../../interfaces/Invite';

const { SEND_INVITATION, SEND_UPDATE, CHANGE_PARTSTAT, DECLINE_INVITATION, CANCEL_INVITATION, NONE } =
    INVITE_ACTION_TYPES;

const getCleanSendData = ({
    emailsWithError,
    sendPreferencesMap,
    inviteActions,
    vevent,
    cancelVevent,
}: {
    sendPreferencesMap: SimpleMap<SendPreferences>;
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
    originalInviteActions: InviteActions
): {
    title: string;
    warningText: string;
    alertType?: 'error' | 'info';
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
                close: c('Action').t`OK`,
            };
        }
        return {
            title: c('Title').t`Organizer cannot be notified`,
            warningText: c('Info').t`The organizer cannot be notified that you want to change your answer:`,
        };
    }
    if (originalInviteActions.type === DECLINE_INVITATION) {
        return {
            title: c('Title').t`Organizer cannot be notified`,
            warningText: c('Info').t`The organizer cannot be notified that you decline the invitation:`,
            alertType: 'error',
            alertText: c('Info').t`Would you like to delete the event anyway?`,
            submit: <ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>,
        };
    }
    return {
        title: c('Title').t`Participants cannot be notified`,
        warningText:
            newInviteActions.type === NONE
                ? c('Info').t`None of the participants can be notified about your changes:`
                : c('Info').t`The following participants cannot be notified about your changes:`,
        alertType: 'info',
        alertText: c('Info').t`Would you like to continue anyway?`,
        submit: c('Action').t`Continue`,
    };
};

interface Props {
    sendPreferencesMap: SimpleMap<SendPreferences>;
    inviteActions: InviteActions;
    vevent?: VcalVeventComponent;
    cancelVevent?: VcalVeventComponent;
    onConfirm: (data: CleanSendIcsActionData) => void;
    onClose: () => void;
}
const SendWithErrorsConfirmationModal = ({
    sendPreferencesMap,
    inviteActions,
    vevent,
    cancelVevent,
    onConfirm,
    ...rest
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
        rest.onClose();
    };

    const renderEmailRow = (email: string) => {
        if (!cleanSendData.emailsWithError.includes(email)) {
            return null;
        }
        const error = errorMap[email];
        return (
            <li key={email}>
                <span className="flex max-w100 flex-nowrap on-mobile-flex-column">
                    <strong className="mr0-25 text-ellipsis" title={email}>
                        {`${email}:`}
                    </strong>
                    <span className="text-ellipsis inline-block max-w100" title={error}>
                        {`${error}`}
                    </span>
                </span>
            </li>
        );
    };

    const { title, warningText, alertText, alertType, submit, close } = getModalContent(
        cleanSendData.inviteActions,
        inviteActions
    );

    return (
        <FormModal title={title} submit={submit} close={close} hasSubmit={!!submit} onSubmit={handleConfirm} {...rest}>
            <Alert className="mb1" type="warning">
                {warningText}
            </Alert>
            <div>
                <ul>{Object.keys(errorMap).map(renderEmailRow)}</ul>
            </div>
            {alertText && (
                <Alert className="mb1" type={alertType}>
                    {alertText}
                </Alert>
            )}
        </FormModal>
    );
};

export default SendWithErrorsConfirmationModal;
