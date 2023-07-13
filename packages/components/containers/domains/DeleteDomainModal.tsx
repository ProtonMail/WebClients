import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { deleteDomain } from '@proton/shared/lib/api/domains';
import { Domain } from '@proton/shared/lib/interfaces';

import { Alert, ErrorButton, Prompt, PromptProps } from '../../components';
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

    return (
        <Prompt
            title={c('Title').t`Delete ${domain.DomainName}`}
            buttons={[
                <ErrorButton
                    onClick={() => {
                        withLoading(handleConfirmDelete());
                    }}
                    loading={loading}
                >{c('Action').t`Delete`}</ErrorButton>,
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <Alert className="mb-4" type="info">{c('Info')
                .t`Please note that if you delete this domain, all the addresses associated with it will be disabled.`}</Alert>
            <Alert className="mb-4" type="error">{c('Info').t`Are you sure you want to delete this domain?`}</Alert>
        </Prompt>
    );
};

export default DeleteDomainModal;
