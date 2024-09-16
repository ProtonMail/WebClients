import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import { deleteDomain } from '@proton/shared/lib/api/domains';
import type { Domain } from '@proton/shared/lib/interfaces';

import { ErrorButton } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    domain: Domain;
}

const DeleteDomainModal = ({ domain, ...rest }: Props) => {
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

    const domainName = (
        <strong key="domain" className="text-break">
            {domain.DomainName}
        </strong>
    );

    return (
        <Prompt
            title={c('Delete domain prompt').t`Delete domain?`}
            buttons={[
                <ErrorButton
                    onClick={() => {
                        withLoading(handleConfirmDelete());
                    }}
                    loading={loading}
                >{c('Delete domain prompt').t`Delete`}</ErrorButton>,
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Delete domain prompt')
                .jt`Please note that if you delete this domain ${domainName}, all the addresses associated with it will be disabled.`}
            <br />
            <br />
            {c('Delete domain prompt').t`Are you sure you want to delete this domain?`}
        </Prompt>
    );
};

export default DeleteDomainModal;
