import React from 'react';
import PropTypes from 'prop-types';
import {
    ConfirmModal,
    useModals,
    Alert,
    DropdownActions,
    useLoading,
    useApi,
    useAuthentication,
    useNotifications,
    useEventManager,
} from 'react-components';
import { c } from 'ttag';
import { authMember, removeMember, updateRole, privatizeMember } from 'proton-shared/lib/api/members';
import { revokeSessions } from 'proton-shared/lib/api/memberSessions';
import { MEMBER_PRIVATE, MEMBER_ROLE } from 'proton-shared/lib/constants';
import memberLogin from 'proton-shared/lib/authentication/memberLogin';

import EditMemberModal from './EditMemberModal';
import AuthModal from '../password/AuthModal';

const MemberActions = ({ member, addresses = [], organization }) => {
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();

    const handleConfirmDelete = async () => {
        await api(removeMember(member.ID));
        await call();
        createNotification({ text: c('Success message').t`User deleted` });
    };

    const login = async () => {
        const apiConfig = authMember(member.ID);
        const {
            result: { UID },
        } = await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={apiConfig} />);
        });

        const url = `${location.origin}/login/sub`;
        await memberLogin({ UID, mailboxPassword: authentication.getPassword(), url });
    };

    const makeAdmin = async () => {
        await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_OWNER));
        await call();
        createNotification({ text: c('Success message').t`Role updated` });
    };

    const revokeAdmin = async () => {
        await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
        await call();
        createNotification({ text: c('Success message').t`Role updated` });
    };

    const makePrivate = async () => {
        await api(privatizeMember(member.ID));
        await call();
        createNotification({ text: c('Success message').t`Status updated` });
    };

    const revokeMemberSessions = async () => {
        await api(revokeSessions(member.ID));
        await call();
        createNotification({ text: c('Success message').t`Sessions revoked` });
    };

    const canMakeAdmin = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_MEMBER;
    const canDelete = !member.Self;
    const canEdit = organization.HasKeys;
    const canRevoke = !member.Self && member.Role === MEMBER_ROLE.ORGANIZATION_OWNER;
    const canRevokeSessions = !member.Self;

    const canLogin =
        !member.Self && member.Private === MEMBER_PRIVATE.READABLE && member.Keys.length && addresses.length;
    const canMakePrivate = member.Private === MEMBER_PRIVATE.READABLE;

    const openEdit = () => {
        createModal(<EditMemberModal member={member} />);
    };

    const openDelete = () => {
        createModal(
            <ConfirmModal onConfirm={() => withLoading(handleConfirmDelete())}>
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
            onClick: openEdit,
        },
        canDelete && {
            text: c('Member action').t`Delete`,
            actionType: 'delete',
            onClick: openDelete,
        },
        canMakeAdmin && {
            text: c('Member action').t`Make admin`,
            onClick: () => withLoading(makeAdmin()),
        },
        canRevoke && {
            text: c('Member action').t`Revoke admin`,
            onClick: () => withLoading(revokeAdmin()),
        },
        canLogin && {
            text: c('Member action').t`Login`,
            onClick: login,
        },
        canMakePrivate && {
            text: c('Member action').t`Make private`,
            onClick: () => withLoading(makePrivate()),
        },
        canRevokeSessions && {
            text: c('Member action').t`Revoke sessions`,
            onClick: () => withLoading(revokeMemberSessions()),
        },
    ].filter(Boolean);

    return <DropdownActions loading={loading} list={list} className="pm-button--small" />;
};

MemberActions.propTypes = {
    member: PropTypes.object.isRequired,
    addresses: PropTypes.array.isRequired,
    organization: PropTypes.object.isRequired,
};

export default MemberActions;
