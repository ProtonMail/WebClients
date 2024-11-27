import { type FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/pass/components/Layout/Card/Card';
import { AliasSyncToggle } from '@proton/pass/components/Settings/Aliases/AliasSyncToggle';
import { Domains } from '@proton/pass/components/Settings/Aliases/Domains';
import { AliasMailboxes } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxes';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';

export const Aliases: FC = () => {
    const aliasManagementEnabled = useFeatureFlag(PassFeature.PassAdvancedAliasManagementV1);

    return (
        <>
            {aliasManagementEnabled ? (
                <>
                    <Domains />
                    <AliasMailboxes />
                </>
            ) : (
                <>
                    <SettingsPanel title={c('Label').t`Alias management`}>
                        <Card type="primary">{c('Info')
                            .t`Alias management features from SimpleLogin are coming soon!`}</Card>
                    </SettingsPanel>
                </>
            )}
            <AliasSyncToggle />
        </>
    );
};
