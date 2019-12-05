import { useLoading, useNotifications } from 'react-components';
import { useState } from 'react';
import { getI18N } from './eventForm/i18n';

export const useForm = ({ model, errors, onSave, onClose, onDelete, isCreateEvent }) => {
    const { createNotification } = useNotifications();

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loadingAction, withLoadingAction] = useLoading();
    const i18n = getI18N('event');

    const handleSubmit = () => {
        setIsSubmitted(true);
        if (Object.keys(errors).length > 0) {
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
    }
};
