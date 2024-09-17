import { type FC } from 'react';

import { c } from 'ttag';

import { SettingsPanel } from './SettingsPanel';
import { ThemeSelector } from './ThemeSelector';

export const Theme: FC = () => {
    return (
        <SettingsPanel title={c('Label').t`Theme`}>
            <ThemeSelector />
        </SettingsPanel>
    );
};
