import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import clsx from '@proton/utils/clsx';

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
        <div className="flex mx-auto justify-space-between gap-2 setting-container w-full flex-nowrap">
            <label
                className={clsx('setting-label text-ellipsis', noiseFilter ? 'color-norm' : 'color-hint')}
                htmlFor={`${idBase}-noise-filter`}
            >{c('Action').t`Noise cancellation`}</label>
            <Toggle
                id={`${idBase}-noise-filter`}
                checked={noiseFilter}
                onChange={() => toggleNoiseFilter()}
                className={clsx('settings-toggle', noiseFilter ? '' : 'settings-toggle-inactive')}
            />
        </div>
    );
};
