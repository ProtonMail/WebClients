import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { deleteDomain } from '@proton/shared/lib/api/domains';
import type { Domain } from '@proton/shared/lib/interfaces';

import { useApi, useEventManager, useNotifications } from '../../../hooks';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    domain: Domain;
}

const RemoveSSODomain = ({ domain, ...rest }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        void metrics.core_sso_remove_domain_modal_load_total.increment({ step: 'remove-domain' });
    }, []);

    const handleConfirmDelete = async () => {
        try {
            await api(deleteDomain(domain.ID));
            await call();
            rest.onClose?.();
            createNotification({ text: c('Success message').t`Domain deleted` });

            metrics.core_sso_remove_domain_total.increment({
                status: 'success',
            });
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_sso_remove_domain_total.increment({
                    status,
                })
            );
            throw error;
        }
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
