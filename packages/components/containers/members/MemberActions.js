import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { SmallButton, ConfirmModal, useModal, Alert } from 'react-components';
import { c } from 'ttag';
import ContextApi from 'proton-shared/lib/context/api';
import { removeMember } from 'proton-shared/lib/api/members';

import MemberModal from './MemberModal';

const MemberActions = ({ member }) => {
    const { api } = useContext(ContextApi);
    const { isOpen: showEdit, open: openEdit, close: closeEdit } = useModal();
    const { isOpen: showDelete, open: openDelete, close: closeDelete } = useModal();
    const handleConfirmDelete = () => api(removeMember(member.ID));

    return (
        <>
            <SmallButton onClick={openEdit}>{c('Action').t`Edit`}</SmallButton>
            <MemberModal show={showEdit} onClose={closeEdit} member={member} />
            <SmallButton className="pm-button-redborder" onClick={openDelete}>{c('Action').t`Delete`}</SmallButton>
            <ConfirmModal show={showDelete} onClose={closeDelete} onConfirm={handleConfirmDelete}>
                <Alert>{c('Info').t`Are you sure you want to permanently delete this user? The inbox and all addresses associated with this user will be deleted.`}</Alert>
            </ConfirmModal>
        </>
    );
};

MemberActions.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberActions;