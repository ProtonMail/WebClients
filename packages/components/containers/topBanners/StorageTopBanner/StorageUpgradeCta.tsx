import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useConfig from '@proton/components/hooks/useConfig';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { getCompleteSpaceDetails, getPlanToUpsell, getSpace } from '@proton/shared/lib/user/storage';

import { getStorageUpsell } from './helperStorageBanner';

export const StorageUpgradeCta = () => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();

    const space = getSpace(user);
    const details = getCompleteSpaceDetails(space);
    const plan = getPlanToUpsell({ storageDetails: details, app: APP_NAME });

    const upsellRef = getStorageUpsell(APP_NAME);

    return user.canPay ? (
        <SettingsLink
            key="storage-link"
            className="color-inherit"
            path={addUpsellPath(getUpgradePath({ user, plan, subscription }), upsellRef)}
        >
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
