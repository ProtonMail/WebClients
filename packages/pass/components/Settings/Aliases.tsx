import type { FC } from 'react';

import { AliasDomains } from '@proton/pass/components/Settings/Aliases/Domains/AliasDomains';
import { AliasDomainsProvider } from '@proton/pass/components/Settings/Aliases/Domains/DomainsProvider';
import { AliasMailboxes } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxes';
import { AliasMailboxesProvider } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxesProvider';
import { AliasSyncToggle } from '@proton/pass/components/Settings/Aliases/Sync/AliasSyncToggle';

export const Aliases: FC = () => (
    <>
        <AliasMailboxesProvider>
            <AliasDomainsProvider>
                <AliasDomains />
                <AliasMailboxes />
            </AliasDomainsProvider>
        </AliasMailboxesProvider>

        <AliasSyncToggle />
    </>
);
