import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { deleteCustomDomain } from '@proton/pass/store/actions';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { useAliasDomains, useCustomDomain } from './DomainsProvider';

type Props = { domainID: number };

export const CustomDomainDeleteModal: FC<Props> = ({ domainID }) => {
    const { onDelete, setAction } = useAliasDomains();
    const onClose = () => setAction(null);

    const domain = useCustomDomain(domainID);
    const deleteDomain = useRequest(deleteCustomDomain, { onSuccess: pipe(onDelete, onClose) });

    useEffect(() => {
        if (!domain) onClose();
    }, [domain]);

    const domainTextBold = <strong key="domain-to-delete">{domain?.Domain}</strong>;

    const alertText =
        domain?.AliasCount && domain.AliasCount > 0
            ? c('Info')
                  .jt`This operation is irreversible. All aliases using the domain ${domainTextBold} will be deleted. Please note that once deleted, aliases can't be restored.`
            : c('Info').jt`This operation is irreversible.`;

    return (
        domain && (
            <ConfirmationModal
                open
                title={c('Title').t`Delete domain`}
                submitText={c('Action').t`Delete`}
                size="medium"
                onClose={onClose}
                onSubmit={() => deleteDomain.dispatch(domainID)}
                closeAfterSubmit={false}
                disabled={deleteDomain.loading}
                alertText={alertText}
            />
        )
    );
};
