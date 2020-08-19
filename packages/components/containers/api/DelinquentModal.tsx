import React from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';
import { APPS } from 'proton-shared/lib/constants';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import { FormModal, Alert, useAppLink } from '../../components';
import { useConfig } from '../../hooks';

interface Props {
    [key: string]: any;
}

const DelinquentModal = ({ ...rest }: Props) => {
    const history = useHistory();
    const { APP_NAME } = useConfig();
    const title = c('Delinquent modal title').t`Overdue invoice`;
    const goToApp = useAppLink();

    const handleSubmit = () => {
        if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
            return history.push('/payments#invoices');
        }
        return goToApp('/subscription#invoices', getAccountSettingsApp());
    };

    return (
        <FormModal
            title={title}
            hasClose={false}
            close={null}
            submit={c('Action').t`View invoice`}
            onSubmit={handleSubmit}
            small
            {...rest}
        >
            <Alert type="warning">{c('Info')
                .t`Your Proton account is currently on hold. To continue using your account, please pay any overdue invoices.`}</Alert>
        </FormModal>
    );
};

export default DelinquentModal;
