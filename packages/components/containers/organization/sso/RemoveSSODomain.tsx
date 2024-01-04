import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { deleteDomain } from '@proton/shared/lib/api/domains';
import { Domain } from '@proton/shared/lib/interfaces';

import { Prompt, PromptProps } from '../../../components';
import { useApi, useEventManager, useNotifications } from '../../../hooks';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    domain: Domain;
}

const RemoveSSODomain = ({ domain, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    const handleConfirmDelete = async () => {
        await api(deleteDomain(domain.ID));
        await call();
        rest.onClose?.();
        createNotification({ text: c('Success message').t`Domain deleted` });
    };

    const boldDomain = <b key="remove-sso-domain-name">{domain.DomainName}</b>;

    return (
        <Prompt
            title={c('Title').t`Remove domain`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        void withLoading(handleConfirmDelete());
                    }}
                    loading={loading}
                >{c('Action').t`Remove`}</Button>,
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <div>{c('Info').jt`Are you sure you want to remove the domain ${boldDomain}?`}</div>
        </Prompt>
    );
};

export default RemoveSSODomain;
