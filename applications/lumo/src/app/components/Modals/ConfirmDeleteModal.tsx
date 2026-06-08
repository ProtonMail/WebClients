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
    loading?: boolean;
}

const ConfirmDeleteModal = ({ handleDelete, deleteAll = false, count = 1, loading, ...modalProps }: Props) => {
    const imageTools = useFlag('LumoImageTools');

    // "Delete all" and any multi-selection share the plural copy; a single conversation uses the singular copy.
    const isPlural = deleteAll || count > 1;

    const title = deleteAll
        ? c('Action').t`Delete all conversations?`
        : isPlural
          ? // translator: ${count} is the number of selected conversations being deleted
            c('Action').ngettext(msgid`Delete ${count} conversation?`, `Delete ${count} conversations?`, count)
          : c('Action').t`Delete conversation?`;

    const message = deleteAll
        ? c('Action').t`Are you sure you want to delete all conversations?`
        : isPlural
          ? // translator: ${count} is the number of selected conversations being deleted
            c('Action').ngettext(
                msgid`Are you sure you want to delete ${count} conversation?`,
                `Are you sure you want to delete ${count} conversations?`,
                count
            )
          : c('Action').t`Are you sure you want to delete this conversation?`;

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
            {imageTools && (
                <div className="flex flex-row flex-nowrap items-start gap-2 mt-4 p-3 rounded bg-weak">
                    <IcExclamationTriangleFilled className="color-warning shrink-0 mt-0.5" size={4} />
                    <span className="text-bold">{imagesMessage}</span>
                </div>
            )}
        </Prompt>
    );
};

export default ConfirmDeleteModal;
