import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { getItem, setItem } from 'proton-shared/lib/helpers/storage';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import { useUser, useConfig } from '../../hooks';
import TopBanner from './TopBanner';
import AppLink from '../../components/link/AppLink';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

const StorageLimitTopBanner = () => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const spacePercentage = (user.UsedSpace * 100) / user.MaxSpace;
    const spaceDisplayed = Number.isNaN(spacePercentage) ? 0 : Math.floor(spacePercentage);
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useState(
        getItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`) === 'true'
    );
    const paymentLinkProps =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? {
                  to: '/payments#invoices',
              }
            : {
                  to: '/subscription#invoices',
                  toApp: getAccountSettingsApp(),
              };
    useEffect(() => {
        if (ignoreStorageLimit) {
            setItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`, 'true');
        }
    }, [ignoreStorageLimit]);

    const upgradeLink = (
        <AppLink key="storage-link" className="color-currentColor" {...paymentLinkProps}>
            {c('Link').t`Upgrade account`}
        </AppLink>
    );
    const freeUpMessage = user.canPay
        ? c('Info').t`Free up some space or add more storage space.`
        : c('Info').t`Free up some space or contact your administrator.`;
    if (spacePercentage >= 100) {
        return (
            <TopBanner className="bg-global-warning">{c('Info')
                .jt`You reached 100% of your storage capacity. You cannot send or receive new emails. ${freeUpMessage} ${upgradeLink}`}</TopBanner>
        );
    }

    if (!ignoreStorageLimit && spacePercentage >= 90 && spacePercentage < 100) {
        return (
            <TopBanner className="bg-global-attention color-global-grey" onClose={() => setIgnoreStorageLimit(true)}>{c(
                'Info'
            ).jt`You reached ${spaceDisplayed}% of your storage capacity. ${freeUpMessage} ${upgradeLink}`}</TopBanner>
        );
    }
    return null;
};

export default StorageLimitTopBanner;
