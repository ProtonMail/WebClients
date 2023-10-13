import type { FC } from 'react';

import { SettingsPanel } from 'proton-pass-extension/lib/components/Settings/SettingsPanel';
import { c } from 'ttag';

import { Exporter } from '@proton/pass/components/Export/Exporter';

export const Export: FC = () => {
    return (
        <SettingsPanel title={c('Label').t`Export`}>
            <Exporter />
        </SettingsPanel>
    );
};
