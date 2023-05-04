import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { useAuthentication } from '@proton/components/hooks';
import useApi from '@proton/components/hooks/useApi';
import { revoke } from '@proton/shared/lib/api/auth';
import { authMember } from '@proton/shared/lib/api/members';
import { getUser } from '@proton/shared/lib/api/user';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import {
    maybeResumeSessionByUser,
    persistSessionWithPassword,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { User } from '@proton/shared/lib/interfaces';
import { CachedOrganizationKey, Organization } from '@proton/shared/lib/interfaces';
import { Member } from '@proton/shared/lib/interfaces/Member';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import { LearnMore, Prompt, PromptProps } from '../../components';
import { AuthModal } from '../password';

export const validateMemberLogin = (
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

interface Props extends Omit<PromptProps, 'title' | 'children' | 'buttons'> {
    member: Member;
    app: APP_NAMES;
}

const LoginMemberModal = ({ app, member, onClose, ...rest }: Props) => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const [authed, setAuthed] = useState(false);
    const [data, setData] = useState<{ LocalID: number }>();
    const authentication = useAuthentication();

    const switchUrl = useMemo(() => {
        const href = getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT);
        const search = `?product=${getSlugFromApp(app || APPS.PROTONMAIL)}`;
        return `${href}${search}`;
    }, [app]);

    if (!authed || !data) {
        const handleData = async (data: { UID: string; LocalID: number }) => {
            const UID = data?.UID;
            const LocalID = data?.LocalID;

            if (!UID || !LocalID) {
                throw new Error('Failed to get auth data');
            }

            const memberApi = <T,>(config: any) => silentApi<T>(withUIDHeaders(UID, config));
            const User = await memberApi<{ User: User }>(getUser()).then(({ User }) => User);

            const validatedSession = await maybeResumeSessionByUser(silentApi, User);
            if (validatedSession) {
                memberApi(revoke()).catch(noop);
                return validatedSession.LocalID;
            }

            await persistSessionWithPassword({
                api: memberApi,
                keyPassword: authentication.getPassword(),
                User,
                LocalID,
                UID,
                persistent: authentication.getPersistent(),
                trusted: false,
            });

            return LocalID;
        };
        return (
            <AuthModal
                config={authMember(member.ID)}
                {...rest}
                onCancel={onClose}
                onSuccess={async ({ response }) => {
                    const data = await response.json();
                    const LocalID = await handleData(data);
                    setData({ LocalID });
                    setAuthed(true);
                }}
            />
        );
    }

    const memberAddress = <b key="member">{member.Addresses?.[0].Email || member.Name}</b>;

    return (
        <Prompt
            title={c('Title').t`Signed in to member account`}
            buttons={[
                <ButtonLike as="a" color="norm" target="_blank" href={switchUrl} onClick={onClose}>
                    {c('Action').t`Switch account`}
                </ButtonLike>,
                <Button color="weak" onClick={onClose}>
                    {c('Action').t`Close`}
                </Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <div className="mb-4 text-break">{c('Info').jt`You are signed in to the account ${memberAddress}.`}</div>
            <div>
                {c('Info').t`You can now access and manage the account as an administrator.`}{' '}
                <LearnMore url={getKnowledgeBaseUrl('/manage-public-users-organization')} />
            </div>
        </Prompt>
    );
};

export default LoginMemberModal;
