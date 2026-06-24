import { c } from 'ttag';

import { SettingsToggle } from './shared/SettingsToggle';

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
        <SettingsToggle
            id={`${idBase}-noise-filter`}
            label={c('Action').t`Noise cancellation`}
            ariaLabel={c('Alt').t`Noise cancellation`}
            onChange={() => toggleNoiseFilter()}
            checked={noiseFilter}
        />
    );
};
