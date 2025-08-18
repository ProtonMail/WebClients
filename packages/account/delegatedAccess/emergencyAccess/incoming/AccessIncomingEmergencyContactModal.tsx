import { useMemo } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

interface Props extends Omit<PromptProps, 'title' | 'children' | 'buttons'> {
    user: string;
    email: string;
    app: APP_NAMES;
}

const AccessIncomingEmergencyContactModal = ({ app, user, email, onClose, ...rest }: Props) => {
    const account = <b key="account">{user}</b>;

    const switchUrl = useMemo(() => {
        const href = getAppHref(`/${getSlugFromApp(app || APPS.PROTONMAIL)}`, APPS.PROTONACCOUNT);
        const search = `?email=${email}`;
        return `${href}${search}`;
    }, [app]);

    return (
        <Prompt
            title={c('Title').t`Signed in to another account`}
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
            <div className="mb-4 text-break">{c('emergency_access')
                .jt`You are signed in to the account ${account}.`}</div>
            <div>{c('emergency_access').t`You can now access and manage their account.`}</div>
        </Prompt>
    );
};

export default AccessIncomingEmergencyContactModal;
