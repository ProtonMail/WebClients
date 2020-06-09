import React, { useEffect, useState } from 'react';
import { getItem, setItem } from 'proton-shared/lib/helpers/storage';
import { c } from 'ttag';

import { Href, useUser } from '../../index';
import TopBanner from './TopBanner';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

const TopBanners = () => {
    const [user] = useUser();
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useState(
        getItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`) === 'true'
    );
    // TODO Update links once we have proton-account
    const upgradeLink = (
        <Href key="storage-link" className="color-currentColor" url="/settings/subscription" target="_self">{c('Link')
            .t`Upgrade account`}</Href>
    );
    const payInvoiceLink = (
        <Href key="pay-invoices" className="color-currentColor" url="/settings/subscription" target="_self">{c('Link')
            .t`Pay invoice`}</Href>
    );
    const spacePercentage = (user.UsedSpace * 100) / user.MaxSpace;

    useEffect(() => {
        if (ignoreStorageLimit) {
            setItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`, 'true');
        }
    }, [ignoreStorageLimit]);

    return (
        <>
            {!isNaN(spacePercentage) && spacePercentage >= 100 ? (
                <TopBanner className="bg-global-warning">{c('Info')
                    .jt`You reached 100% of your storage capacity. You cannot send or receive new emails. Free up some space or add more storage space. ${upgradeLink}`}</TopBanner>
            ) : null}
            {!ignoreStorageLimit && !isNaN(spacePercentage) && spacePercentage >= 90 && spacePercentage < 100 ? (
                <TopBanner className="bg-global-attention" onClose={() => setIgnoreStorageLimit(true)}>{c('Info')
                    .jt`You reached 90% of your storage capacity. Free up some space or add more storage space. ${upgradeLink}`}</TopBanner>
            ) : null}
            {user.isDelinquent && user.canPay ? (
                <TopBanner className="bg-global-warning">{c('Info')
                    .jt`Your account has at least one overdue invoice. Your access will soon get restricted. ${payInvoiceLink}`}</TopBanner>
            ) : null}
            {user.isDelinquent && user.isMember ? (
                <TopBanner className="bg-global-warning">{c('Info')
                    .t`Account access restricted due to unpaid invoices. Please contact your administrator.`}</TopBanner>
            ) : null}
        </>
    );
};

export default TopBanners;
