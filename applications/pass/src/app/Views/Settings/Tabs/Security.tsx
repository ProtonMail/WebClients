import { type FC } from 'react';

import { Offline } from '@proton/pass/components/Settings/Offline';
import { PinLockSetting } from '@proton/pass/components/Settings/PinLockSetting';

export const Security: FC = () =>
    [<PinLockSetting key="pin" />].concat(OFFLINE_SUPPORTED ? [<Offline key="offline" />] : []);
