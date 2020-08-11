import React, { useEffect, useState } from 'react';
import { getItem, setItem } from 'proton-shared/lib/helpers/storage';
import { APPS } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import { useUser, useConfig, useOnline } from '../../index';
import TopBanner from './TopBanner';
import AppLink from '../../components/link/AppLink';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

const TopBanners = () => {
    const onlineStatus = useOnline();
    const [backOnline, setBackOnline] = useState(false);
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useState(
        getItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`) === 'true'
    );

    const paymentLinkProps = APP_NAME === APPS.PROTONVPN_SETTINGS ? {
        to: '/payments#invoices',
    } : {
        to: '/subscription#invoices',
        toApp: getAccountSettingsApp()
    };
    const upgradeLink = (
        <AppLink
            key="storage-link"
            className="color-currentColor"
            {...paymentLinkProps}
        >
            {c('Link').t`Upgrade account`}
        </AppLink>
    );
    const payInvoiceLink = (
        <AppLink key="pay-invoices" className="color-currentColor" {...paymentLinkProps}>{c('Link').t`Pay invoice`}</AppLink>
    );
    const spacePercentage = (user.UsedSpace * 100) / user.MaxSpace;
    const spaceDisplayed = isNaN(spacePercentage) ? 0 : Math.round(spacePercentage);

    useEffect(() => {
        if (ignoreStorageLimit) {
            setItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`, 'true');
        }
    }, [ignoreStorageLimit]);

    useEffect(() => {
        if (!onlineStatus) {
            setBackOnline(true);
        }

        if (onlineStatus) {
            const timeout = window.setTimeout(() => {
                setBackOnline(false);
            }, 2000);
            return () => window.clearTimeout(timeout);
        }
    }, [onlineStatus]);

    return (
        <>
            {spaceDisplayed >= 100 ? (
                <TopBanner className="bg-global-warning">{c('Info')
                    .jt`You reached 100% of your storage capacity. You cannot send or receive new emails. Free up some space or add more storage space. ${upgradeLink}`}</TopBanner>
            ) : null}
            {!ignoreStorageLimit && spaceDisplayed >= 90 && spaceDisplayed < 100 ? (
                <TopBanner className="bg-global-attention" onClose={() => setIgnoreStorageLimit(true)}>{c('Info')
                    .jt`You reached ${spaceDisplayed}% of your storage capacity. Free up some space or add more storage space. ${upgradeLink}`}</TopBanner>
            ) : null}
            {user.isDelinquent && user.canPay ? (
                <TopBanner className="bg-global-warning">{c('Info')
                    .jt`Your account has at least one overdue invoice. Your access will soon get restricted. ${payInvoiceLink}`}</TopBanner>
            ) : null}
            {user.isDelinquent && user.isMember ? (
                <TopBanner className="bg-global-warning">{c('Info')
                    .t`Account access restricted due to unpaid invoices. Please contact your administrator.`}</TopBanner>
            ) : null}
            {onlineStatus ? null : (
                <TopBanner className="bg-global-warning">{c('Info')
                    .t`Internet connection lost. Please check your device's connectivity.`}</TopBanner>
            )}
            {onlineStatus && backOnline ? (
                <TopBanner className="bg-global-success">{c('Info').t`Internet connection restored.`}</TopBanner>
            ) : null}
        </>
    );
};

export default TopBanners;
