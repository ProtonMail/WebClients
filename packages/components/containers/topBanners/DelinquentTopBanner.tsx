import React from 'react';
import { c } from 'ttag';
import { UNPAID_STATE } from 'proton-shared/lib/constants';
import { getInvoicesPathname } from 'proton-shared/lib/apps/helper';

import { useUser, useConfig } from '../../hooks';
import { SettingsLink } from '../../components';
import TopBanner from './TopBanner';

const DelinquentTopBanner = () => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();

    if (!user.Delinquent) {
        return null;
    }
    const payInvoiceLink = (
        <SettingsLink
            app={APP_NAME}
            key="pay-invoices"
            className="color-inherit"
            path={getInvoicesPathname(APP_NAME)}
            target="_self"
        >{c('Link').t`Pay invoice`}</SettingsLink>
    );
    if (user.canPay) {
        if (user.Delinquent === UNPAID_STATE.NO_RECEIVE) {
            return (
                <TopBanner className="bg-danger">
                    {c('Info')
                        .jt`Your account has at least one overdue invoice. Your access has been restricted. ${payInvoiceLink}`}
                </TopBanner>
            );
        }
        return (
            <TopBanner className="bg-danger">
                {c('Info')
                    .jt`Your account has at least one overdue invoice. Your access will soon get restricted. ${payInvoiceLink}`}
            </TopBanner>
        );
    }
    if (user.isMember) {
        return (
            <TopBanner className="bg-danger">
                {c('Info').t`Account access restricted due to unpaid invoices. Please contact your administrator.`}
            </TopBanner>
        );
    }
    return null;
};

export default DelinquentTopBanner;
