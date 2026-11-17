import type { FC } from 'react';

import { c } from 'ttag';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useAutoDesktopUnlock } from '@proton/pass/hooks/auth/useDesktopUnlock';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useIFrameAppController } from '../../../../../../../lib/components/Inline/IFrameApp';
import { ListItem } from '../../../../../../../lib/components/Inline/ListItem';

export const DropdownDesktopUnlock: FC = () => {
    const ctrl = useIFrameAppController();
    const { unlockDeclined = false } = useAppState();

    // There's no ui to display error notification, better not to create them
    const { loading, onUnlock } = useAutoDesktopUnlock({ silentErrors: true });

    /** While auto-unlock can still trigger, don't show a dropdown and rely on the
     * auto unlock trigger. Once the user dismissed the biometrics prompt, auto-unlock
     * is suppressed (`unlockDeclined`): offer an explicit action to retry, otherwise
     * the dropdown stays empty until the user unlocks from the popup. */
    if (!unlockDeclined) return null;

    return (
        <ListItem
            disabled={loading}
            icon={{ type: 'status', icon: PassIconStatus.LOCKED_DROPDOWN }}
            title={c('Label').t`Unlock ${PASS_APP_NAME}`}
            subTitle={c('Info').t`Use biometrics to unlock`}
            onClick={() =>
                onUnlock()
                    .then(() => ctrl.close({ refocus: true }))
                    .catch(noop)
            }
        />
    );
};
