import React, { ReactNode } from 'react';
import { c } from 'ttag';
import FormModal from '../modal/FormModal';

interface Props {
    onClose?: () => void;
    onConfirm?: () => void;
    title?: string;
    children?: ReactNode;
    cancel?: ReactNode;
    confirm?: ReactNode;
    loading?: boolean;
}
const Confirm = ({
    onClose,
    onConfirm,
    children,
    title = c('Action').t`Confirm`,
    cancel = c('Action').t`Cancel`,
    confirm = c('Action').t`Confirm`,
    ...rest
}: Props) => {
    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => {
                onConfirm?.();
                onClose?.();
            }}
            title={title}
            close={cancel}
            submit={confirm}
            small
            {...rest}
        >
            {children}
        </FormModal>
    );
};

export default Confirm;
