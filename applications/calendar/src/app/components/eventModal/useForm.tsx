import { useLoading } from 'react-components';
import { useState } from 'react';
import { TITLE_INPUT_ID } from './rows/TitleRow';
import { COUNT_ID, UNTIL_ID } from './rows/EndsRow';
import { EventModel, EventModelErrors } from '../../interfaces/EventModel';
import { NOTIFICATION_ID } from './Notifications';

const focusInput = (el: HTMLElement | null, id: string) => {
    el?.querySelector<HTMLInputElement>(`#${id}`)?.focus();
};

const handleValidation = (errors: EventModelErrors, containerEl: HTMLElement | null) => {
    if (Object.keys(errors).length > 0) {
        for (const [errorId, formId] of [
            ['title', TITLE_INPUT_ID],
            ['until', UNTIL_ID],
            ['count', COUNT_ID],
            ['notifications', NOTIFICATION_ID]
        ]) {
            if (errors[errorId as keyof EventModelErrors]) {
                focusInput(containerEl, formId);
                return true;
            }
        }
        return true;
    }
    return false;
};

interface Arguments {
    containerEl: HTMLElement | null;
    model: EventModel;
    errors: EventModelErrors;
    onSave: (value: EventModel) => Promise<void>;
    onDelete?: () => Promise<void>;
}
export const useForm = ({ containerEl, model, errors, onSave, onDelete }: Arguments) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loadingAction, withLoadingAction] = useLoading();

    const handleSubmit = () => {
        setIsSubmitted(true);
        if (handleValidation(errors, containerEl)) {
            return;
        }
        withLoadingAction(onSave(model));
    };

    const handleDelete = () => {
        if (!onDelete) {
            return;
        }
        withLoadingAction(onDelete());
    };

    return {
        isSubmitted,
        loadingAction,
        handleDelete,
        handleSubmit
    };
};
