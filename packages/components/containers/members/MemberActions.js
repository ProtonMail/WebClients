import React from 'react';
import PropTypes from 'prop-types';
import { SmallButton, ConfirmModal, useModal, Alert, useApiWithoutResult } from 'react-components';
import { c } from 'ttag';
import { connect } from 'react-redux';
import { removeMember } from 'proton-shared/lib/api/members';
import { createNotification } from 'proton-shared/lib/state/notifications/actions';

import EditMemberModal from './EditMemberModal';

const MemberActions = ({ member }) => {
    const { request } = useApiWithoutResult(removeMember);
    const { isOpen: showEdit, open: openEdit, close: closeEdit } = useModal();
    const { isOpen: showDelete, open: openDelete, close: closeDelete } = useModal();

    const handleConfirmDelete = async () => {
        closeDelete();
        await request(member.ID);
        createNotification({ text: c('Success message').t`User deleted` });
    };

    return (
        <>
            <SmallButton onClick={openEdit}>{c('Action').t`Edit`}</SmallButton>
            <EditMemberModal show={showEdit} onClose={closeEdit} member={member} />
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
