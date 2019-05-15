import React from 'react';
import PropTypes from 'prop-types';
import {
    ConfirmModal,
    useModal,
    Alert,
    useApiWithoutResult,
    DropdownActions,
    useNotifications,
    useEventManager
} from 'react-components';
import { c } from 'ttag';
import { removeMember, updateRole, privatizeMember } from 'proton-shared/lib/api/members';
import { MEMBER_PRIVATE, MEMBER_ROLE } from 'proton-shared/lib/constants';

import EditMemberModal from './EditMemberModal';

const MemberActions = ({ member, organization }) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { request: requestRemoveMember } = useApiWithoutResult(removeMember);
    const { request: requestUpdateRole } = useApiWithoutResult(updateRole);
    const { request: requestPrivatize } = useApiWithoutResult(privatizeMember);
    const { isOpen: showEdit, open: openEdit, close: closeEdit } = useModal();
    const { isOpen: showDelete, open: openDelete, close: closeDelete } = useModal();

    const handleConfirmDelete = async () => {
        await requestRemoveMember(member.ID);
        await call();
        closeDelete();
        createNotification({ text: c('Success message').t`User deleted` });
    };

    const login = () => {
        // TODO
    };

    const makeAdmin = async () => {
        await requestUpdateRole(member.ID, MEMBER_ROLE.ORGANIZATION_OWNER);
        await call();
        createNotification({ text: c('Success message').t`Role updated` });
    };

    const revokeAdmin = async () => {
        await requestUpdateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER);
        await call();
        createNotification({ text: c('Success message').t`Role updated` });
    };

    const makePrivate = async () => {
        await requestPrivatize(member.ID);
        await call();
        createNotification({ text: c('Success message').t`Status updated` });
    };

    const canMakeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER;
    const canDelete = !member.Self;
    const canEdit = organization.HasKeys;
    const canRevoke = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_OWNER;

    // TODO fill member.Keys.length
    const canLogin =
        !member.Self && member.Private === MEMBER_PRIVATE.READABLE && member.Keys.length && member.addresses.length;
    const canMakePrivate = member.Private === MEMBER_PRIVATE.READABLE;

    const list = [
        canEdit && {
            text: c('Member action').t`Edit`,
            onClick: openEdit
        },
        canDelete && {
            text: c('Member action').t`Delete`,
            onClick: openDelete
        },
        canMakeAdmin && {
            text: c('Member action').t`Make admin`,
            onClick: makeAdmin
        },
        canRevoke && {
            text: c('Member action').t`Revoke admin`,
            onClick: revokeAdmin
        },
        canLogin && {
            text: c('Member action').t`Login`,
            onClick: login
        },
        canMakePrivate && {
            text: c('Member action').t`Make private`,
            onClick: makePrivate
        }
    ].filter(Boolean);

    return (
        <>
            <DropdownActions list={list} className="pm-button--small" />
            {showEdit ? <EditMemberModal onClose={closeEdit} member={member} /> : null}
            {showDelete ? (
                <ConfirmModal onClose={closeDelete} onConfirm={handleConfirmDelete}>
                    <Alert>{c('Info')
                        .t`Are you sure you want to permanently delete this user? The inbox and all addresses associated with this user will be deleted.`}</Alert>
                </ConfirmModal>
            ) : null}
        </>
    );
};

MemberActions.propTypes = {
    member: PropTypes.object.isRequired,
    organization: PropTypes.object.isRequired
};

export default MemberActions;
