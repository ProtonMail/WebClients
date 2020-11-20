import React from 'react';
import { c } from 'ttag';
import { Button, ConfirmModal, Alert, ErrorButton } from '../../components';
import { useModals, useLoading } from '../../hooks';

interface Props {
    onWipe: () => Promise<void>;
    className?: string;
}

const WipeLogsButton = ({ onWipe, className }: Props) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();

    const handleConfirm = () => {
        withLoading(onWipe());
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

    return <Button className={className} loading={loading} onClick={handleOpenModal}>{c('Action').t`Wipe`}</Button>;
};

export default WipeLogsButton;
