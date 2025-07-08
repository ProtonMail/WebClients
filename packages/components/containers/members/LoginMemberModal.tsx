import { useMemo } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';

interface Props extends Omit<PromptProps, 'title' | 'children' | 'buttons'> {
    member: Member;
    app: APP_NAMES;
}

const LoginMemberModal = ({ app, member, onClose, ...rest }: Props) => {
    const memberEmail = getMemberEmailOrName(member);
    const memberAddress = <b key="member">{memberEmail}</b>;

    const switchUrl = useMemo(() => {
        const href = getAppHref(`/${getSlugFromApp(app || APPS.PROTONMAIL)}`, APPS.PROTONACCOUNT);
        const search = `?email=${memberEmail}`;
        return `${href}${search}`;
    }, [app]);

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
