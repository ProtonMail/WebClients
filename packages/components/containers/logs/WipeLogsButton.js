import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Button, ConfirmModal, Alert, useModal } from 'react-components';

const WipeLogsButton = ({ onWipe, className }) => {
    const { isOpen, open, close } = useModal();
    const handleConfirm = () => {
        onWipe();
        close();
    };
    return (
        <>
            <Button className={className} onClick={open}>{c('Action').t`Wipe`}</Button>
            {isOpen ? (
                <ConfirmModal onClose={close} onConfirm={handleConfirm}>
                    <Alert>{c('Message').t`Are you sure you want to clear all your logs?`}</Alert>
                </ConfirmModal>
            ) : null}
        </>
    );
};

WipeLogsButton.propTypes = {
    onWipe: PropTypes.func.isRequired,
    className: PropTypes.string
};

export default WipeLogsButton;
