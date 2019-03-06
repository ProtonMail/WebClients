import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { SmallButton, ConfirmModal, useModal, Alert } from 'react-components';
import { c } from 'ttag';
import { connect } from 'react-redux';
import ContextApi from 'proton-shared/lib/context/api';
import { removeMember } from 'proton-shared/lib/api/members';
import { createNotification } from 'proton-shared/lib/state/notifications/actions';

import MemberModal from './MemberModal';

const MemberActions = ({ member }) => {
    const { api } = useContext(ContextApi);
    const { isOpen: showEdit, open: openEdit, close: closeEdit } = useModal();
    const { isOpen: showDelete, open: openDelete, close: closeDelete } = useModal();

    const handleConfirmDelete = async () => {
        closeDelete();
        await api(removeMember(member.ID));
        createNotification({ text: c('Success message').t`User deleted` });
    };

    return (
        <>
            <SmallButton onClick={openEdit}>{c('Action').t`Edit`}</SmallButton>
            <MemberModal show={showEdit} onClose={closeEdit} member={member} />
            <SmallButton onClick={openDelete}>{c('Action').t`Delete`}</SmallButton>
            <ConfirmModal show={showDelete} onClose={closeDelete} onConfirm={handleConfirmDelete}>
                <Alert>{c('Info')
                    .t`Are you sure you want to permanently delete this user? The inbox and all addresses associated with this user will be deleted.`}</Alert>
            </ConfirmModal>
        </>
    );
};

MemberActions.propTypes = {
    member: PropTypes.object.isRequired
};

const mapDispatchToProps = { createNotification };

export default connect(
    null,
    mapDispatchToProps
)(MemberActions);
