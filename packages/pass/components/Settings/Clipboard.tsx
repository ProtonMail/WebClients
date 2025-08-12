import type { FC } from 'react';

import { c } from 'ttag';

import { ClipboardSettings } from '@proton/pass/components/Settings/Clipboard/ClipboardSettings';

import { SettingsPanel } from './SettingsPanel';

export const Clipboard: FC = () => {
    return (
        <SettingsPanel title={c('Label').t`Clear clipboard after`}>
            <ClipboardSettings />
        </SettingsPanel>
    );
};
