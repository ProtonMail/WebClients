import type { FC } from 'react';

import { c } from 'ttag';

import { Exporter } from '../../../shared/components/export';
import { SettingsPanel } from '../component/SettingsPanel';

export const Export: FC = () => {
    return (
        <SettingsPanel title={c('Label').t`Export`}>
            <Exporter />
        </SettingsPanel>
    );
};
