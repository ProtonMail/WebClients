import { c } from 'ttag';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectMirrorSelfView, setMirrorSelfViewAndPersist } from '@proton/meet/store/slices/settings';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';

export const MirrorSelfViewToggle = () => {
    const dispatch = useMeetDispatch();
    const mirrorSelfView = useMeetSelector(selectMirrorSelfView);

    return (
        <SettingToggle
            id="mirror-self-view"
            label={c('Action').t`Mirror self view`}
            ariaLabel={c('Alt').t`Mirror self view`}
            onChange={() => dispatch(setMirrorSelfViewAndPersist(!mirrorSelfView))}
            checked={mirrorSelfView}
        />
    );
};
