import { type FC } from 'react';

import { Offline } from '@proton/pass/components/Settings/Offline';
import { PinLockSetting } from '@proton/pass/components/Settings/PinLockSetting';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';

export const Security: FC = () => {
    const canToggleOfflineMode = useFeatureFlag(PassFeature.PassWebOfflineMode);

    return (
        <>
            <PinLockSetting key="pin" />
            {canToggleOfflineMode && <Offline key="offline" />}
        </>
    );
};
