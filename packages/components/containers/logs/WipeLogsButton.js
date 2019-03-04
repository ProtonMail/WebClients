import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Button, ConfirmModal, Alert, useModal } from 'react-components';

const WipeLogsButton = ({ onWipe }) => {
    const { isOpen, open, close } = useModal();
    const handleConfirm = () => {
        onWipe();
        close();
    };
    return (
        <>
            <Button onClick={open}>{c('Action').t`Wipe`}</Button>
            <ConfirmModal show={isOpen} onClose={close} onConfirm={handleConfirm}>
                <Alert>{c('Message').t`Are you sure you want to clear all your logs?`}</Alert>
            </ConfirmModal>
        </>
    );
};

WipeLogsButton.propTypes = {
    onWipe: PropTypes.func.isRequired
};

export default WipeLogsButton;
