import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Prompt } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import { useFlag } from '@proton/unleash/useFlag';

interface Props extends ModalStateProps {
    handleDelete: () => void;
    /** Confirm deletion of every conversation (settings "Delete all"). */
    deleteAll?: boolean;
    /** Number of conversations being deleted. Used for plural messaging on bulk delete. Defaults to 1. */
    count?: number;
    /** Whether any of the conversations being deleted contain generated images. */
    hasGeneratedImages?: boolean;
    loading?: boolean;
}

const ConfirmDeleteModal = ({
    handleDelete,
    deleteAll = false,
    count = 1,
    hasGeneratedImages = false,
    loading,
    ...modalProps
}: Props) => {
    const imageTools = useFlag('LumoImageTools');

    // "Delete all" and any multi-selection share the plural copy; a single conversation uses the singular copy.
    const isPlural = deleteAll || count > 1;

    let title: string;
    if (deleteAll) {
        title = c('Action').t`Delete all conversations?`;
    } else if (isPlural) {
        // translator: ${count} is the number of selected conversations being deleted
        title = c('Action').ngettext(msgid`Delete ${count} conversation?`, `Delete ${count} conversations?`, count);
    } else {
        title = c('Action').t`Delete conversation?`;
    }

    let message: string;
    if (deleteAll) {
        message = c('Action').t`Are you sure you want to delete all conversations?`;
    } else if (isPlural) {
        // translator: ${count} is the number of selected conversations being deleted
        message = c('Action').ngettext(
            msgid`Are you sure you want to delete ${count} conversation?`,
            `Are you sure you want to delete ${count} conversations?`,
            count
        );
    } else {
        message = c('Action').t`Are you sure you want to delete this conversation?`;
    }

    const imagesMessage = isPlural
        ? c('collider_2025:Info').t`Any images generated in these conversations will also be deleted.`
        : c('collider_2025:Info').t`Any images generated in this conversation will also be deleted.`;

    const deleteButtonText = deleteAll ? c('collider_2025').t`Delete all` : c('collider_2025').t`Delete`;

    return (
        <Prompt
            {...modalProps}
            title={title}
            buttons={[
                <Button color="danger" onClick={handleDelete} loading={loading}>
                    {deleteButtonText}
                </Button>,
                <Button onClick={modalProps.onClose}>{c('collider_2025:Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="m-0">{message}</p>
            {imageTools && hasGeneratedImages && (
                <div className="flex flex-row flex-nowrap items-start gap-2 mt-4 p-3 rounded bg-weak">
                    <IcExclamationTriangleFilled className="color-warning shrink-0 mt-0.5" size={4} />
                    <span className="text-bold">{imagesMessage}</span>
                </div>
            )}
        </Prompt>
    );
};

export default ConfirmDeleteModal;
