import { type FC } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/pass/components/Layout/Card/Card';
import { AliasDomains } from '@proton/pass/components/Settings/Aliases/Domains/AliasDomains';
import { AliasDomainsProvider } from '@proton/pass/components/Settings/Aliases/Domains/DomainsProvider';
import { AliasMailboxes } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxes';
import { AliasMailboxesProvider } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxesProvider';
import { AliasSyncToggle } from '@proton/pass/components/Settings/Aliases/Sync/AliasSyncToggle';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';

export const Aliases: FC = () => {
    const aliasManagementEnabled = useFeatureFlag(PassFeature.PassAdvancedAliasManagementV1);

    return (
        <>
            {aliasManagementEnabled ? (
                <AliasMailboxesProvider>
                    <AliasDomainsProvider>
                        <AliasDomains />
                        <AliasMailboxes />
                    </AliasDomainsProvider>
                </AliasMailboxesProvider>
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
