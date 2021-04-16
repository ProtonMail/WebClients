import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { getItem, setItem } from 'proton-shared/lib/helpers/storage';

import { useUser } from '../../hooks';
import { SettingsLink } from '../../components';

import TopBanner from './TopBanner';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

const StorageLimitTopBanner = () => {
    const [user] = useUser();
    const spacePercentage = (user.UsedSpace * 100) / user.MaxSpace;
    const spaceDisplayed = Number.isNaN(spacePercentage) ? 0 : Math.floor(spacePercentage);
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useState(
        getItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`) === 'true'
    );
    useEffect(() => {
        if (ignoreStorageLimit) {
            setItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`, 'true');
        }
    }, [ignoreStorageLimit]);

    const upgradeLink = user.canPay ? (
        <SettingsLink key="storage-link" className="color-inherit" path="/dashboard">
            {c('Link').t`Upgrade account`}
        </SettingsLink>
    ) : (
        ''
    );
    const freeUpMessage = user.canPay
        ? c('Info').t`Free up some space or add more storage space.`
        : c('Info').t`Free up some space or contact your administrator.`;
    if (spacePercentage >= 100) {
        return (
            <TopBanner className="bg-danger">{c('Info')
                .jt`You reached 100% of your storage capacity. You cannot send or receive new emails. ${freeUpMessage} ${upgradeLink}`}</TopBanner>
        );
    }

    if (!ignoreStorageLimit && spacePercentage >= 80 && spacePercentage < 100) {
        return (
            <TopBanner className="bg-warning" onClose={() => setIgnoreStorageLimit(true)}>{c('Info')
                .jt`You reached ${spaceDisplayed}% of your storage capacity. ${freeUpMessage} ${upgradeLink}`}</TopBanner>
        );
    }
    return null;
};

export default StorageLimitTopBanner;
