import React from 'react';
import { c } from 'ttag';
import { getInvoicesPathname } from 'proton-shared/lib/apps/helper';

import { Alert, ButtonLike, FormModal, SettingsLink } from '../../components';
import { useConfig } from '../../hooks';

interface Props {
    [key: string]: any;
}

const DelinquentModal = ({ ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const title = c('Delinquent modal title').t`Overdue invoice`;

    const submitButton = (
        <ButtonLike
            onClick={rest.onClose}
            color="norm"
            as={SettingsLink}
            path={getInvoicesPathname(APP_NAME)}
            app={APP_NAME}
            target="_self"
        >{c('Action').t`View invoice`}</ButtonLike>
    );

    return (
        <FormModal
            title={title}
            hasClose={false}
            close={null}
            submit={submitButton}
            onSubmit={rest.onClose}
            small
            {...rest}
        >
            <Alert type="warning">{c('Info')
                .t`Your Proton account is currently on hold. To continue using your account, please pay any overdue invoices.`}</Alert>
        </FormModal>
    );
};

export default DelinquentModal;
