import { c } from 'ttag';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';

export const NoiseCancellingToggle = ({
    idBase,
    noiseFilter,
    toggleNoiseFilter,
}: {
    idBase: string;
    noiseFilter: boolean;
    toggleNoiseFilter: () => void;
}) => {
    return (
        <SettingToggle
            id={`${idBase}-noise-filter`}
            label={c('Action').t`Noise cancellation`}
            ariaLabel={c('Alt').t`Noise cancellation`}
            onChange={() => toggleNoiseFilter()}
            checked={noiseFilter}
        />
    );
};
