import { type FC } from 'react';

import { c } from 'ttag';

import { PassThemeCardList } from './PassThemeCardList';
import { SettingsPanel } from './SettingsPanel';

export const Theme: FC = () => {
    return (
        <SettingsPanel title={c('Label').t`Theme`}>
            <PassThemeCardList />
        </SettingsPanel>
    );
};
