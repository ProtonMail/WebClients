import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { APP_NAMES, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { addUpsellPath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { SettingsLink } from '../../components';
import { useConfig, useUser } from '../../hooks';
import TopBanner from './TopBanner';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

interface Props {
    app?: APP_NAMES;
}

const StorageLimitTopBanner = ({ app }: Props) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const spacePercentage = (user.UsedSpace * 100) / user.MaxSpace;
    const spaceDisplayed = Number.isNaN(spacePercentage) ? 0 : Math.floor(spacePercentage);
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useState(
        getItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`) === 'true'
    );

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.STORAGE_PERCENTAGE,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: app,
    });

    useEffect(() => {
        if (ignoreStorageLimit) {
            setItem(`${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`, 'true');
        }
    }, [ignoreStorageLimit]);

    const upgradeLink = user.canPay ? (
        <SettingsLink key="storage-link" className="color-inherit" path={addUpsellPath('/upgrade', upsellRef)}>
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
