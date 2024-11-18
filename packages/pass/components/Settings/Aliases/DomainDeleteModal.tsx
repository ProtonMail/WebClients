import { type FC } from 'react';

import { c } from 'ttag';

import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { deleteCustomDomain } from '@proton/pass/store/actions';
import type { CustomDomainOutput } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export type DomainToDelete = Pick<CustomDomainOutput, 'ID' | 'Domain'>;

type Props = {
    domainToDelete: DomainToDelete;
    onClose: () => void;
    onRemove: (domainID: number) => void;
};

export const DomainDeleteModal: FC<Props> = ({ domainToDelete, onClose, onRemove }) => {
    /* When using onSuccess of useRequest in modal: manually close at the end and not too early
     * (disabling `closeAfterSubmit` prop below) to avoid component unmounting and onSuccess not triggering */
    const deleteDomainRequest = useRequest(deleteCustomDomain, {
        onSuccess: pipe(() => onRemove(domainToDelete.ID), onClose),
    });

    const onSubmit = () => deleteDomainRequest.dispatch(domainToDelete.ID);

    const domainTextBold = <strong key="domain-to-delete">{domainToDelete.Domain}</strong>;

    return (
        <ConfirmationModal
            open
            title={c('Title').t`Delete domain`}
            submitText={c('Action').t`Delete`}
            size="medium"
            onClose={onClose}
            onSubmit={onSubmit}
            closeAfterSubmit={false}
            disabled={deleteDomainRequest.loading}
            alertText={c('Info')
                .jt`This operation is irreversible. All aliases using the domain ${domainTextBold} will be deleted.`}
        />
    );
};
