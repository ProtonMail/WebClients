import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Button, ConfirmModal, Alert, useModals } from 'react-components';

const WipeLogsButton = ({ onWipe, className }) => {
    const { createModal } = useModals();

    const handleConfirm = () => {
        onWipe();
        close();
    };

    const handleOpenModal = () => {
        createModal(
            <ConfirmModal onConfirm={handleConfirm}>
                <Alert>{c('Message').t`Are you sure you want to clear all your logs?`}</Alert>
            </ConfirmModal>
        );
    };

    return <Button className={className} onClick={handleOpenModal}>{c('Action').t`Wipe`}</Button>;
};

WipeLogsButton.propTypes = {
    onWipe: PropTypes.func.isRequired,
    className: PropTypes.string
};

export default WipeLogsButton;
