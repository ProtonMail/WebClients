import React from 'react';
import { c } from 'ttag';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Alert, SmallButton, ConfirmModal, useModal, useApi } from 'react-components';
import { deleteDomain } from 'proton-shared/lib/api/domains';
import { createNotification } from 'proton-shared/lib/state/notifications/actions';

import DomainModal from './DomainModal';

const DomainActions = ({ domain, createNotification }) => {
    const { request, loading } = useApi(() => deleteDomain(domain.ID));
    const { isOpen: showEditModal, open: openEditModal, close: closeEditModal } = useModal();
    const { isOpen: showDeleteModal, open: openDeleteModal, close: closeDeleteModal } = useModal();

    const handleConfirmDelete = async () => {
        await request();
        closeDeleteModal();
        createNotification({ text: c('Success message').t`Domain deleted` });
    };

    return (
        <>
            <SmallButton onClick={openEditModal}>{c('Action').t`Edit`}</SmallButton>
            <DomainModal show={showEditModal} onClose={closeEditModal} domain={domain} />
            <SmallButton onClick={openDeleteModal}>{c('Action').t`Delete`}</SmallButton>
            <ConfirmModal
                loading={loading}
                show={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                title={c('Title').t`Delete domain`}
            >
                <Alert>{c('Info').t`Are you sure you want to delete this domain?`}</Alert>
            </ConfirmModal>
        </>
    );
};

DomainActions.propTypes = {
    domain: PropTypes.object.isRequired,
    createNotification: PropTypes.func.isRequired
};

const mapDispatchToProps = { createNotification };

export default connect(
    null,
    mapDispatchToProps
)(DomainActions);
