import type { FC } from 'react';

import { AliasDomains } from './Aliases/Domains/AliasDomains';
import { AliasDomainsProvider } from './Aliases/Domains/DomainsProvider';
import { AliasMailboxes } from './Aliases/Mailboxes/AliasMailboxes';
import { AliasMailboxesProvider } from './Aliases/Mailboxes/AliasMailboxesProvider';
import { AliasSyncToggle } from './Aliases/Sync/AliasSyncToggle';

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
