import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal } from 'react-components';

const Confirm = ({
    title,
    onClose,
    onConfirm,
    children,
    cancel = c('Action').t`Cancel`,
    confirm = c('Action').t`Confirm`,
    ...rest
}) => {
    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => {
                onConfirm();
                onClose();
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

Confirm.propTypes = {
    onClose: PropTypes.func,
    onConfirm: PropTypes.func,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    cancel: PropTypes.node,
    confirm: PropTypes.node,
    loading: PropTypes.bool
};

export default Confirm;
