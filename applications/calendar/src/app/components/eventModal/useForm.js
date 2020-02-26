import { useLoading, useNotifications } from 'react-components';
import { useState } from 'react';
import { getI18N } from './eventForm/i18n';
import { TITLE_INPUT_ID } from './rows/TitleRow';
import { COUNT_ID, UNTIL_ID } from './rows/EndsRow';

const focusInput = (el, id) => {
    if (!el) {
        return;
    }
    const inputEl = el.querySelector(`#${id}`);
    if (inputEl) {
        inputEl.focus();
    }
};

const handleValidation = (errors, formEl) => {
    if (Object.keys(errors).length > 0) {
        for (const [errorId, formId] of [
            ['title', TITLE_INPUT_ID],
            ['until', UNTIL_ID],
            ['count', COUNT_ID]
        ]) {
            if (errors[errorId]) {
                focusInput(formEl, formId);
                return true;
            }
        }
        return true;
    }
    return false;
};

export const useForm = ({ formEl, model, errors, onSave, onClose, onDelete, isCreateEvent }) => {
    const { createNotification } = useNotifications();

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loadingAction, withLoadingAction] = useLoading();
    const i18n = getI18N('event');

    const handleSubmit = () => {
        setIsSubmitted(true);
        if (handleValidation(errors, formEl)) {
            return;
        }
        const run = async () => {
            await onSave(model);
            createNotification({ text: isCreateEvent ? i18n.created : i18n.updated });
            onClose({ safe: true });
        };
        withLoadingAction(run());
    };

    const handleDelete = () => {
        const run = async () => {
            await onDelete();
            createNotification({ text: i18n.deleted });
            onClose({ safe: true });
        };
        withLoadingAction(run());
    };

    return {
        isSubmitted,
        loadingAction,
        i18n,
        handleDelete,
        handleSubmit
    };
};
