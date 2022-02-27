import { c } from 'ttag';
import { authMember } from '@proton/shared/lib/api/members';
import { APPS, isSSOMode, isStandaloneMode, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
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
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';

import { DropdownActions } from '../../components';
import { useApi, useAuthentication, useLoading, useModals, useNotifications } from '../../hooks';

import AuthModal from '../password/AuthModal';

interface Props {
    member: Member;
    onEdit: (member: Member) => void;
    onDelete: (member: Member) => Promise<void>;
    onRevoke: (member: Member) => Promise<void>;
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

const MemberActions = ({
    member,
    onEdit,
    onDelete,
    onRevoke,
    addresses = [],
    organization,
    organizationKey,
}: Props) => {
    const api = useApi();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();

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
            const memberApi = <T,>(config: any) => silentApi<T>(withUIDHeaders(UID, config));
            const User = await memberApi<{ User: tsUser }>(getUser()).then(({ User }) => User);

            const done = (localID: number) => {
                const url = getAppHref('/overview', APPS.PROTONACCOUNT, localID);
                window.open(url);
            };

            const validatedSession = await maybeResumeSessionByUser(silentApi, User);
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
                persistent: authentication.getPersistent(),
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

    const canDelete = !member.Self;
    const canEdit = organization.HasKeys;
    const canRevokeSessions = !member.Self;

    const canLogin =
        !member.Self && member.Private === MEMBER_PRIVATE.READABLE && member.Keys.length && addresses.length;

    const list = [
        canEdit && {
            text: c('Member action').t`Edit`,
            onClick: () => {
                onEdit(member);
            },
        },
        canDelete &&
            ({
                text: c('Member action').t`Delete`,
                actionType: 'delete',
                onClick: () => {
                    withLoading(onDelete(member));
                },
            } as const),
        canLogin && {
            text: c('Member action').t`Sign in`,
            onClick: login,
        },
        canRevokeSessions && {
            text: c('Member action').t`Revoke sessions`,
            onClick: () => {
                withLoading(onRevoke(member));
            },
        },
    ].filter(isTruthy);

    return <DropdownActions loading={loading} list={list} size="small" />;
};

export default MemberActions;
