import { c } from 'ttag';
import { authMember, removeMember, updateRole } from '@proton/shared/lib/api/members';
import { revokeSessions } from '@proton/shared/lib/api/memberSessions';
import { APPS, isSSOMode, isStandaloneMode, MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import memberLogin from '@proton/shared/lib/authentication/memberLogin';
import { Address, CachedOrganizationKey, Member, Organization, User as tsUser } from '@proton/shared/lib/interfaces';
import { noop } from '@proton/shared/lib/helpers/function';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { revoke } from '@proton/shared/lib/api/auth';
import {
    maybeResumeSessionByUser,
    persistSessionWithPassword,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getUser } from '@proton/shared/lib/api/user';
import { MemberAuthResponse } from '@proton/shared/lib/authentication/interface';
import { LoginTypes } from '@proton/shared/lib/authentication/LoginInterface';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';

import { DropdownActions } from '../../components';
import {
    useApi,
    useAuthentication,
    useEventManager,
    useLoading,
    useLoginType,
    useModals,
    useNotifications,
} from '../../hooks';

import EditMemberModal from './EditMemberModal';
import AuthModal from '../password/AuthModal';
import DeleteMemberModal from './DeleteMemberModal';

interface Props {
    member: Member;
    addresses: Address[];
    organization: Organization;
    organizationKey: CachedOrganizationKey | undefined;
}

const validateMemberLogin = (
    organization: Organization | undefined,
    organizationKey: CachedOrganizationKey | undefined
) => {
    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);
    if (organizationKeyInfo.userNeedsToActivateKey) {
        return c('Error').t`The organization key must be activated first.`;
    }
    if (organizationKeyInfo.userNeedsToReactivateKey) {
        return c('Error').t`Permission denied, administrator privileges have been restricted.`;
    }
    if (!organizationKey?.privateKey) {
        return c('Error').t`Organization key is not decrypted.`;
    }
};

const MemberActions = ({ member, addresses = [], organization, organizationKey }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const loginType = useLoginType();

    const handleConfirmDelete = async () => {
        if (member.Role === MEMBER_ROLE.ORGANIZATION_OWNER) {
            await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
        }
        await api(removeMember(member.ID));
        await call();
    };

    const login = async () => {
        const error = validateMemberLogin(organization, organizationKey);
        if (error) {
            return createNotification({ type: 'error', text: error });
        }
        const apiConfig = authMember(member.ID);
        const { UID, LocalID } = await new Promise((resolve, reject) => {
            createModal(
                <AuthModal<MemberAuthResponse>
                    onClose={reject}
                    onSuccess={({ result }) => resolve(result)}
                    config={apiConfig}
                />
            );
        });

        if (isSSOMode) {
            const memberApi = <T,>(config: any) => api<T>(withUIDHeaders(UID, config));
            const User = await memberApi<{ User: tsUser }>(getUser()).then(({ User }) => User);

            const done = (localID: number) => {
                const url = getAppHref('/overview', APPS.PROTONACCOUNT, localID);
                if (loginType === LoginTypes.TRANSIENT || loginType === LoginTypes.PERSISTENT_WORKAROUND) {
                    document.location.assign(url);
                } else {
                    window.open(url);
                }
            };

            const validatedSession = await maybeResumeSessionByUser(api, User);
            if (validatedSession) {
                memberApi(revoke()).catch(noop);
                done(validatedSession.LocalID);
                return;
            }

            await persistSessionWithPassword({
                api: memberApi,
                keyPassword: authentication.getPassword(),
                User,
                LocalID,
                UID,
            });
            done(LocalID);
            return;
        }

        if (isStandaloneMode) {
            return;
        }

        // Legacy mode
        const url = `${window.location.origin}/login/sub`;
        await memberLogin({ UID, mailboxPassword: authentication.getPassword(), url } as any);
    };

    const revokeMemberSessions = async () => {
        await api(revokeSessions(member.ID));
        await call();
        createNotification({ text: c('Success message').t`Sessions revoked` });
    };

    const canDelete = !member.Self;
    const canEdit = organization.HasKeys;
    const canRevokeSessions = !member.Self;

    const canLogin =
        !member.Self && member.Private === MEMBER_PRIVATE.READABLE && member.Keys.length && addresses.length;

    const openEdit = () => {
        createModal(<EditMemberModal member={member} onClose={noop} />);
    };

    const openDelete = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(<DeleteMemberModal member={member} onConfirm={resolve} onClose={reject} />);
        });
        await withLoading(handleConfirmDelete());
        createNotification({ text: c('Success message').t`User deleted` });
    };

    const list = [
        canEdit && {
            text: c('Member action').t`Edit`,
            onClick: openEdit,
        },
        canDelete &&
            ({
                text: c('Member action').t`Delete`,
                actionType: 'delete',
                onClick: openDelete,
            } as const),
        canLogin && {
            text: c('Member action').t`Sign in`,
            onClick: login,
        },
        canRevokeSessions && {
            text: c('Member action').t`Revoke sessions`,
            onClick: () => withLoading(revokeMemberSessions()),
        },
    ].filter(isTruthy);

    return <DropdownActions loading={loading} list={list} size="small" />;
};

export default MemberActions;
