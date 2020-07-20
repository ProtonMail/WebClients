import React from 'react';
import { c } from 'ttag';
import { History } from 'history';
import { withRouter } from 'react-router-dom';
import { APPS } from 'proton-shared/lib/constants';
import { redirectTo } from 'proton-shared/lib/helpers/browser';

import { FormModal, useConfig, Alert } from '../../index';

interface Props {
    history: History;
    [key: string]: any;
}

const DelinquentModal = ({ history, ...rest }: Props) => {
    const { APP_NAME } = useConfig();
    const title = c('Delinquent modal title').t`Overdue invoice`;

    const handleSubmit = () => {
        if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
            history.push('/payments#invoices');
        } else if (APP_NAME === APPS.PROTONACCOUNT) {
            history.push('/subscription#invoices');
        } else if (APP_NAME === APPS.PROTONMAIL_SETTINGS) {
            // TODO remove this if once general settings are in proton-account
            history.push('/settings/subscription#invoices');
        } else {
            redirectTo('/settings/subscription#invoices'); // TODO replace this URL once general settings are in proton-account
        }
    };

    return (
        <FormModal
            title={title}
            hasClose={false}
            close={null}
            submit={c('Action').t`View invoice`}
            onSubmit={handleSubmit}
            small={true}
            {...rest}
        >
            <Alert type="warning">{c('Info')
                .t`Your Proton account is currently on hold. To continue using your account, please pay any overdue invoices.`}</Alert>
        </FormModal>
    );
};

export default withRouter(DelinquentModal);
