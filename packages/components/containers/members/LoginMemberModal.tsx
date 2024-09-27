import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { getOrganizationTokenThunk } from '@proton/account';
import { Button, ButtonLike, Href } from '@proton/atoms';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useDispatch } from '@proton/redux-shared-store';
import { revoke } from '@proton/shared/lib/api/auth';
import { authMember } from '@proton/shared/lib/api/members';
import { getUser } from '@proton/shared/lib/api/user';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { User } from '@proton/shared/lib/interfaces';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';
import noop from '@proton/utils/noop';

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
    const dispatch = useDispatch();

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

            const token = await dispatch(getOrganizationTokenThunk());

            await persistSession({
                api: memberApi,
                keyPassword: token,
                User,
                LocalID,
                UID,
                // Signing into subuser doesn't need offline mode support
                clearKeyPassword: '',
                offlineKey: undefined,
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

    const memberAddress = <b key="member">{getMemberEmailOrName(member)}</b>;

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
                <Href href={getKnowledgeBaseUrl('/manage-public-users-organization')}>{c('Link').t`Learn more`}</Href>
            </div>
        </Prompt>
    );
};

export default LoginMemberModal;
