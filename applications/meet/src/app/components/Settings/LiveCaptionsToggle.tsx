import { c } from 'ttag';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { useLiveCaptionsToggle } from './useLiveCaptionsToggle';

export const LiveCaptionsToggle = () => {
    const { checked, loading, disabled, tooltip, onChange, modals } = useLiveCaptionsToggle();

    return (
        <>
            <SettingToggle
                id={`live-captions`}
                label={c('Action').t`Live captions`}
                ariaLabel={c('Alt').t`Live captions`}
                onChange={onChange}
                checked={checked}
                loading={loading}
                disabled={disabled}
                tooltip={tooltip}
            />
            {modals}
        </>
    );
};
