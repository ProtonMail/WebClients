import React from 'react';
import { c } from 'ttag';
import { APPS, UNPAID_STATE } from 'proton-shared/lib/constants';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import { useUser, useConfig } from '../../hooks';
import TopBanner from './TopBanner';
import AppLink from '../../components/link/AppLink';

const DelinquentTopBanner = () => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const paymentLinkProps =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? {
                  to: '/payments#invoices',
              }
            : {
                  to: '/subscription#invoices',
                  toApp: getAccountSettingsApp(),
              };
    const payInvoiceLink = (
        <AppLink key="pay-invoices" className="color-inherit" {...paymentLinkProps}>{c('Link').t`Pay invoice`}</AppLink>
    );
    if (!user.Delinquent) {
        return null;
    }
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
