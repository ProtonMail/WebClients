import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import type { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { getCleanSendDataFromSendPref, getSendPrefErrorMap } from '../../../helpers/sendPreferences';
import type { CleanSendIcsActionData, InviteActions } from '../../../interfaces/Invite';
import { INVITE_ACTION_TYPES } from '../../../interfaces/Invite';

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
    if (originalInviteActions.type === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
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
    if (originalInviteActions.type === INVITE_ACTION_TYPES.DECLINE_INVITATION) {
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
            newInviteActions.type === INVITE_ACTION_TYPES.NONE
                ? c('Info').t`None of the participants can be notified about your changes:`
                : c('Info').t`The following participants cannot be notified about your changes:`,
        alertText: c('Info').t`Would you like to continue anyway?`,
        close: <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
        submit: <Button color="norm" onClick={onSubmit}>{c('Action').t`Continue`}</Button>,
    };
};

interface Props {
    sendPreferencesMap: SimpleMap<SendPreferences>;
    inviteActions: InviteActions;
    vevent: VcalVeventComponent;
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
    const errorMap = getSendPrefErrorMap(sendPreferencesMap);
    const cleanSendData = getCleanSendDataFromSendPref({
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
        <Prompt
            title={title}
            onSubmit={handleConfirm}
            onClose={onClose}
            open={isOpen}
            buttons={[submit, close].filter(Boolean) as [JSX.Element] | [JSX.Element, JSX.Element]}
        >
            <div className="mb-4">{warningText}</div>
            <ul>{Object.keys(errorMap).map(renderEmailRow)}</ul>
            {alertText && <div>{alertText}</div>}
        </Prompt>
    );
};

export default SendWithErrorsConfirmationModal;
