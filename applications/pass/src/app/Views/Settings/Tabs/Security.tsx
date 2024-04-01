import { type FC } from 'react';

import { Offline } from '@proton/pass/components/Settings/Offline';
import { PinLockSetting } from '@proton/pass/components/Settings/PinLockSetting';
import { useOfflineSupported } from '@proton/pass/hooks/useOfflineSupported';
import { truthy } from '@proton/pass/utils/fp/predicates';

export const Security: FC = () => {
    const offlineSupported = useOfflineSupported();
    return [<PinLockSetting key="pin" />, offlineSupported && <Offline key="offline" />].filter(truthy);
};
