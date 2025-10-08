import { useEffect } from 'react';

import { c } from 'ttag';

import { deleteDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { useDispatch } from '@proton/redux-shared-store';
import type { Domain } from '@proton/shared/lib/interfaces';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    domain: Domain;
    onSuccess?: () => void;
}

const RemoveSSODomain = ({ domain, onSuccess, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        void metrics.core_sso_remove_domain_modal_load_total.increment({ step: 'remove-domain' });
    }, []);

    const handleConfirmDelete = async () => {
        try {
            await dispatch(deleteDomain(domain));
            onSuccess?.();
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
            handleError(error);
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
