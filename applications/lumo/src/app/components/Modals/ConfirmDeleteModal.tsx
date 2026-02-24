import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Prompt } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

interface Props extends ModalStateProps {
    handleDelete: () => void;
    deleteAll?: boolean;
    loading?: boolean;
}

const ConfirmDeleteModal = ({ handleDelete, deleteAll = false, loading, ...modalProps }: Props) => {
    const title = deleteAll ? c('Action').t`Delete all conversations?` : c('Action').t`Delete conversation?`;
    const message = deleteAll
        ? c('Action').t`Are you sure you want to delete all conversations?`
        : c('Action').t`Are you sure you want to delete the conversation?`;

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
        </Prompt>
    );
};

export default ConfirmDeleteModal;
