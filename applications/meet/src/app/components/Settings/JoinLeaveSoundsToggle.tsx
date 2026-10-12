import { c } from 'ttag';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectJoinLeaveSoundsEnabled, setJoinLeaveSoundsEnabledAndPersist } from '@proton/meet/store/slices/settings';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';

export const JoinLeaveSoundsToggle = () => {
    const dispatch = useMeetDispatch();
    const joinLeaveSoundsEnabled = useMeetSelector(selectJoinLeaveSoundsEnabled);

    return (
        <SettingToggle
            id="join-leave-sounds"
            label={c('Action').t`Join and leave sounds`}
            ariaLabel={c('Alt').t`Join and leave sounds`}
            onChange={() => dispatch(setJoinLeaveSoundsEnabledAndPersist(!joinLeaveSoundsEnabled))}
            checked={joinLeaveSoundsEnabled}
        />
    );
};
