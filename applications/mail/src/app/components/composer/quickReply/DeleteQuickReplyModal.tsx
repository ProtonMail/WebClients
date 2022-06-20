import { Alert, AlertModal, Button, ErrorButton, ModalProps } from '@proton/components/components';
import { c } from 'ttag';

interface Props extends ModalProps {
    onDeleteDraft: () => void;
}

const DeleteQuickReplyModal = ({ onDeleteDraft, ...rest }: Props) => {
    const { onClose } = rest;

    const handleDelete = () => {
        onDeleteDraft();
        onClose?.();
    };

    return (
        <AlertModal
            title={c('Title').t`Delete draft`}
            buttons={[
                <ErrorButton onClick={handleDelete}>{c('Action').t`Delete`}</ErrorButton>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Alert className="mb1" type="error">{c('Info')
                .t`Are you sure you want to permanently delete this draft?`}</Alert>
        </AlertModal>
    );
};

export default DeleteQuickReplyModal;
