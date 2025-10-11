import { c } from 'ttag';

import { deleteDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import type { Domain } from '@proton/shared/lib/interfaces';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    domain: Domain;
}

const DeleteDomainModal = ({ domain, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();

    const handleConfirmDelete = async () => {
        await dispatch(deleteDomain(domain));
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
                <Button
                    color="danger"
                    onClick={() => {
                        withLoading(handleConfirmDelete()).catch(handleError);
                    }}
                    loading={loading}
                >{c('Delete domain prompt').t`Delete`}</Button>,
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
