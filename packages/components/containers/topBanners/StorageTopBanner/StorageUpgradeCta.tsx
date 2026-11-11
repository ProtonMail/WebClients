import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useCanUpdateBilling } from '@proton/account/userPermissions/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';
import { getCompleteSpaceDetails, getPlanToUpsell, getSpace } from '@proton/shared/lib/user/storage';

import SettingsLink from '../../../components/link/SettingsLink';
import { getStorageUpsell } from './helperStorageBanner';

export const StorageUpgradeCta = () => {
    const [user] = useUser();
    const [canUpdateBilling] = useCanUpdateBilling();
    const { APP_NAME } = useConfig();

    const space = getSpace(user);
    const details = getCompleteSpaceDetails(space);
    const plan = getPlanToUpsell({ storageDetails: details, app: APP_NAME });

    const upsellRef = getStorageUpsell(APP_NAME);

    return canUpdateBilling ? (
        <SettingsLink key="storage-link" className="color-inherit" path={getUpgradePath({ user, plan }, upsellRef)}>
            {
                // Translator: To upload or sync files, free up space or upgrade for more storage
                c('storage_split: info').t`upgrade for more storage`
            }
        </SettingsLink>
    ) : (
        // Translator: To upload or sync files, contact your administrator
        c('storage_split: info').t`contact your administrator`
    );
};
