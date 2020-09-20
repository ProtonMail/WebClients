import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Button, ConfirmModal, Alert, ErrorButton } from '../../components';
import { useModals } from '../../hooks';

const WipeLogsButton = ({ onWipe, className }) => {
    const { createModal } = useModals();

    const handleConfirm = () => {
        onWipe();
    };

    const handleOpenModal = () => {
        createModal(
            <ConfirmModal
                title={c('Title').t`Delete logs`}
                onConfirm={handleConfirm}
                confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
            >
                <Alert type="error">{c('Info').t`Are you sure you want to permanently delete all your logs?`}</Alert>
            </ConfirmModal>
        );
    };

    return <Button className={className} onClick={handleOpenModal}>{c('Action').t`Wipe`}</Button>;
};

WipeLogsButton.propTypes = {
    onWipe: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default WipeLogsButton;
