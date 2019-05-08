import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Alert,
    DropdownActions,
    ConfirmModal,
    useModal,
    useApiWithoutResult,
    useNotifications
} from 'react-components';
import { deleteDomain } from 'proton-shared/lib/api/domains';

import DomainModal from './DomainModal';
import CatchAllModal from './CatchAllModal';

const DomainActions = ({ domain }) => {
    const { request, loading } = useApiWithoutResult(deleteDomain);
    const { createNotification } = useNotifications();
    const { isOpen: showEditModal, open: openEditModal, close: closeEditModal } = useModal();
    const { isOpen: showDeleteModal, open: openDeleteModal, close: closeDeleteModal } = useModal();
    const { isOpen: showCatchAllModal, open: openCatchAllModal, close: closeCatchAllModal } = useModal();

    const handleConfirmDelete = async () => {
        await request(domain.ID);
        closeDeleteModal();
        createNotification({ text: c('Success message').t`Domain deleted` });
    };

    const list = [
        {
            text: c('Action').t`Edit`,
            type: 'button',
            onClick: openEditModal
        },
        {
            text: c('Action').t`Catch all`,
            type: 'button',
            onClick: openCatchAllModal
        },
        {
            text: c('Action').t`Delete`,
            type: 'button',
            onClick: openDeleteModal
        }
    ];

    return (
        <>
            <DropdownActions className="pm-button--small" list={list} />
            {showEditModal ? <DomainModal onClose={closeEditModal} domain={domain} /> : null}
            {showCatchAllModal ? <CatchAllModal onClose={closeCatchAllModal} domain={domain} /> : null}
            {showDeleteModal ? (
                <ConfirmModal
                    loading={loading}
                    onClose={closeDeleteModal}
                    onConfirm={handleConfirmDelete}
                    title={c('Title').t`Delete domain`}
                >
                    <Alert>{c('Info').t`Are you sure you want to delete this domain?`}</Alert>
                </ConfirmModal>
            ) : null}
        </>
    );
};

DomainActions.propTypes = {
    domain: PropTypes.object.isRequired
};

export default DomainActions;
