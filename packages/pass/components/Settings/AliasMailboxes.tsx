import { type FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';

export const AliasMailboxes: FC = () => {
    return (
        <SettingsPanel title={c('Label').t`Alias management`}>
            <Card type="primary">{c('Info').t`Alias management features from SimpleLogin are coming soon!`}</Card>
        </SettingsPanel>
    );
};
