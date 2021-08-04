import { c } from 'ttag';

import ErrorButton from '../button/ErrorButton';
import ConfirmModal, { ConfirmModalProps } from './Confirm';

const DeleteModal = ({ children, ...rest }: ConfirmModalProps) => {
    return (
        <ConfirmModal confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>} {...rest}>
            {children}
        </ConfirmModal>
    );
};

export default DeleteModal;
