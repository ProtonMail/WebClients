import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { getSpace } from '@proton/shared/lib/user/storage';

import useLocalState from '../../hooks/useLocalState';
import LockedStateTopBanner from './LockedStateTopBanner';
import { PooledStorageLimitTopBanner } from './StorageTopBanner/PooledStorageLimitTopBanner';
import { SplitStorageLimitTopBanner } from './StorageTopBanner/SplitStorageLimitTopBanner';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

interface Props {
    app: APP_NAMES;
}

const StorageLimitTopBanner = ({ app }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useLocalState(false, `${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`);

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.STORAGE_PERCENTAGE,
        component: UPSELL_COMPONENT.MODAL,
        fromApp: app,
    });

    if (user.LockedFlags) {
        return (
            <LockedStateTopBanner
                app={app}
                user={user}
                subscription={subscription}
                upsellRef={upsellRef}
                lockedFlags={user.LockedFlags}
            />
        );
    }

    const space = getSpace(user);
    return space.splitStorage ? (
        <SplitStorageLimitTopBanner
            app={app}
            space={space}
            user={user}
            subscription={subscription}
            upsellRef={upsellRef}
            ignoreStorageLimit={ignoreStorageLimit}
            setIgnoreStorageLimit={setIgnoreStorageLimit}
        />
    ) : (
        <PooledStorageLimitTopBanner
            app={app}
            user={user}
            subscription={subscription}
            space={space}
            upsellRef={upsellRef}
            ignoreStorageLimit={ignoreStorageLimit}
            setIgnoreStorageLimit={setIgnoreStorageLimit}
        />
    );
};

export default StorageLimitTopBanner;
