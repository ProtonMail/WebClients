import React from 'react';
import PropTypes from 'prop-types';
import { SmallButton, ConfirmModal, useModal } from 'react-components';
import { c } from 'ttag';

import MemberModal from './MemberModal';

const MemberActions = ({ member }) => {
    const { isOpen: showEdit, open: openEdit, close: closeEdit } = useModal();
    const { isOpen: showDelete, open: openDelete, close: closeDelete } = useModal();

    return (
        <>
            <SmallButton onClick={openEdit}>{c('Action').t`Edit`}</SmallButton>
            <MemberModal show={showEdit} onClose={closeEdit} member={member} />
            <SmallButton onClick={openDelete}>{c('Action').t`Delete`}</SmallButton>
            <ConfirmModal show={showDelete} onClose={closeDelete} ></ConfirmModal>
        </>
    );
};

MemberActions.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberActions;