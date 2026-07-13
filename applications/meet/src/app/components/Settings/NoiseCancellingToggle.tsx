import { c } from 'ttag';

import { SettingToggle, type SettingToggleSize } from '../../atoms/SettingToggle/SettingToggle';

export const NoiseCancellingToggle = ({
    idBase,
    noiseFilter,
    toggleNoiseFilter,
    size = 'large',
}: {
    idBase: string;
    noiseFilter: boolean;
    toggleNoiseFilter: () => void;
    size?: SettingToggleSize;
}) => {
    return (
        <SettingToggle
            id={`${idBase}-noise-filter`}
            label={c('Action').t`Noise cancellation`}
            ariaLabel={c('Alt').t`Noise cancellation`}
            onChange={() => toggleNoiseFilter()}
            checked={noiseFilter}
            size={size}
        />
    );
};
