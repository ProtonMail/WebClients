import { c } from 'ttag';
import { AlertModal, Button } from '../../../components';

interface DeleteLinkConfirmationModalProps {
    onClose: () => void;
    onConfirm: () => void;
    isOpen: boolean;
}

const DeleteLinkConfirmationModal = ({ onClose, onConfirm, isOpen }: DeleteLinkConfirmationModalProps) => (
    <AlertModal
        open={isOpen}
        onClose={onClose}
        buttons={[
            <Button color="danger" type="submit" onClick={onConfirm}>{c('Action').t`Delete link`}</Button>,
            <Button onClick={onClose}>{c(`Action`).t`Cancel`}</Button>,
        ]}
        title={c('Info').t`Delete link?`}
    >
        {c('Info')
            .t`Anyone with this link won't be able to sync or get future updates for your calendar. If you want to give them access again, you will have to create a new link.`}
    </AlertModal>
);

export default DeleteLinkConfirmationModal;
