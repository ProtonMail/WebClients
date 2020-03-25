import { useLoading } from 'react-components';
import { useState } from 'react';
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

export const useForm = ({ formEl, model, errors, onSave, onDelete }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loadingAction, withLoadingAction] = useLoading();

    const handleSubmit = () => {
        setIsSubmitted(true);
        if (handleValidation(errors, formEl)) {
            return;
        }
        withLoadingAction(onSave(model));
    };

    const handleDelete = () => {
        withLoadingAction(onDelete());
    };

    return {
        isSubmitted,
        loadingAction,
        handleDelete,
        handleSubmit
    };
};
