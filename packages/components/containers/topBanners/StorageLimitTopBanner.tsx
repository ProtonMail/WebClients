import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getSpace } from '@proton/shared/lib/user/storage';

import useLocalState from '../../hooks/useLocalState';
import LockedStateTopBanner from './LockedStateTopBanner';
import { PooledStorageLimitTopBanner } from './StorageTopBanner/PooledStorageLimitTopBanner';
import { SplitStorageLimitTopBanner } from './StorageTopBanner/SplitStorageLimitTopBanner';
import { getStorageUpsell } from './StorageTopBanner/helperStorageBanner';

const IGNORE_STORAGE_LIMIT_KEY = 'ignore-storage-limit';

interface Props {
    app: APP_NAMES;
}

const StorageLimitTopBanner = ({ app }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const [ignoreStorageLimit, setIgnoreStorageLimit] = useLocalState(false, `${IGNORE_STORAGE_LIMIT_KEY}${user.ID}`);

    const upsellRef = getStorageUpsell(APP_NAME);

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
            ignoreStorageLimit={ignoreStorageLimit}
            setIgnoreStorageLimit={setIgnoreStorageLimit}
        />
    ) : (
        <PooledStorageLimitTopBanner
            app={app}
            space={space}
            ignoreStorageLimit={ignoreStorageLimit}
            setIgnoreStorageLimit={setIgnoreStorageLimit}
        />
    );
};

export default StorageLimitTopBanner;
