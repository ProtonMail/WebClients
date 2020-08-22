import React from 'react';
import { c } from 'ttag';

import ErrorButton from '../button/ErrorButton';
import ConfirmModal from './Confirm';

interface Props {
    children: React.ReactNode;
}

const DeleteModal = ({ children, ...rest }: Props) => {
    return (
        <ConfirmModal confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>} {...rest}>
            {children}
        </ConfirmModal>
    );
};

export default DeleteModal;
