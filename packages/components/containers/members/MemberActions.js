import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    ConfirmModal,
    useModals,
    Alert,
    useApiWithoutResult,
    DropdownActions,
    useNotifications,
    useEventManager
} from 'react-components';
import { c } from 'ttag';
import { removeMember, updateRole, privatizeMember } from 'proton-shared/lib/api/members';
import { revokeSessions } from 'proton-shared/lib/api/memberSessions';
import { MEMBER_PRIVATE, MEMBER_ROLE } from 'proton-shared/lib/constants';

import EditMemberModal from './EditMemberModal';

const MemberActions = ({ member, organization }) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    const { request: requestRemoveMember } = useApiWithoutResult(removeMember);
    const { request: requestUpdateRole } = useApiWithoutResult(updateRole);
    const { request: requestPrivatize } = useApiWithoutResult(privatizeMember);
    const { request: requestRevokeSessions } = useApiWithoutResult(revokeSessions);
    const { createModal } = useModals();

    const handleConfirmDelete = async () => {
        try {
            setLoading(true);
            await requestRemoveMember(member.ID);
            await call();
            setLoading(false);
            createNotification({ text: c('Success message').t`User deleted` });
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const login = () => {
        // TODO
    };

    const makeAdmin = async () => {
        try {
            setLoading(true);
            await requestUpdateRole(member.ID, MEMBER_ROLE.ORGANIZATION_OWNER);
            await call();
            setLoading(false);
            createNotification({ text: c('Success message').t`Role updated` });
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const revokeAdmin = async () => {
        try {
            setLoading(true);
            await requestUpdateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER);
            await call();
            setLoading(false);
            createNotification({ text: c('Success message').t`Role updated` });
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const makePrivate = async () => {
        try {
            setLoading(true);
            await requestPrivatize(member.ID);
            await call();
            setLoading(false);
            createNotification({ text: c('Success message').t`Status updated` });
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const revokeMemberSessions = async () => {
        try {
            setLoading(true);
            await requestRevokeSessions(member.ID);
            await call();
            setLoading(false);
            createNotification({ text: c('Success message').t`Sessions revoked` });
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const canMakeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER;
    const canDelete = !member.Self;
    const canEdit = organization.HasKeys;
    const canRevoke = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_OWNER;
    const canRevokeSessions = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_OWNER;

    // TODO fill member.Keys.length
    const canLogin =
        !member.Self && member.Private === MEMBER_PRIVATE.READABLE && member.Keys.length && member.addresses.length;
    const canMakePrivate = member.Private === MEMBER_PRIVATE.READABLE;

    const openEdit = () => {
        createModal(<EditMemberModal member={member} />);
    };

    const openDelete = () => {
        createModal(
            <ConfirmModal onConfirm={handleConfirmDelete}>
                <Alert>
                    {c('Info')
                        .t`Are you sure you want to permanently delete this user? The inbox and all addresses associated with this user will be deleted.`}
                </Alert>
            </ConfirmModal>
        );
    };

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
        },
        canRevokeSessions && {
            text: c('Member action').t`Revoke sessions`,
            onClick: revokeMemberSessions
        }
    ].filter(Boolean);

    return <DropdownActions loading={loading} list={list} className="pm-button--small" />;
};

MemberActions.propTypes = {
    member: PropTypes.object.isRequired,
    organization: PropTypes.object.isRequired
};

export default MemberActions;
