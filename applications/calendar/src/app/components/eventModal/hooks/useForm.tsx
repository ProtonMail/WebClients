import { useLoading } from 'react-components';
import { useState } from 'react';
import { InviteActions } from '../../../interfaces/Invite';
import { COUNT_ID, UNTIL_ID } from '../rows/EndsRow';
import { EventModelErrors } from '../../../interfaces/EventModel';
import { NOTIFICATION_ID } from '../Notifications';
import { TITLE_INPUT_ID } from '../const';

const focusInput = (el: HTMLElement | null, id: string) => {
    el?.querySelector<HTMLInputElement>(`#${id}`)?.focus();
};

const handleValidation = (errors: EventModelErrors, containerEl: HTMLElement | null) => {
    if (Object.keys(errors).length > 0) {
        for (const [errorId, formId] of [
            ['title', TITLE_INPUT_ID],
            ['until', UNTIL_ID],
            ['count', COUNT_ID],
            ['notifications', NOTIFICATION_ID],
        ]) {
            if (errors[errorId as keyof EventModelErrors]) {
                focusInput(containerEl, formId);
                return true;
            }
        }

        if (errors.participantError === false) {
            return false;
        }

        return true;
    }
    return false;
};

export enum ACTION {
    SUBMIT,
    DELETE,
}

interface Arguments {
    containerEl: HTMLElement | null;
    errors: EventModelErrors;
    onSave: (inviteActions: InviteActions) => Promise<void>;
    onDelete?: (inviteActions: InviteActions) => Promise<void>;
}

export const useForm = ({ containerEl, errors, onSave, onDelete }: Arguments) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loadingAction, withLoadingAction] = useLoading();
    const [lastAction, setLastAction] = useState<ACTION | null>(null);

    const handleSubmit = (inviteActions: InviteActions) => {
        setIsSubmitted(true);
        setLastAction(ACTION.SUBMIT);
        if (handleValidation(errors, containerEl)) {
            return;
        }
        void withLoadingAction(onSave(inviteActions));
    };

    const handleDelete = (inviteActions: InviteActions) => {
        setLastAction(ACTION.DELETE);
        if (!onDelete) {
            return;
        }
        void withLoadingAction(onDelete(inviteActions));
    };

    return {
        isSubmitted,
        loadingAction,
        handleDelete,
        handleSubmit,
        lastAction,
    };
};
