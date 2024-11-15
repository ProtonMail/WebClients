import { type FC } from 'react';

import { AliasSyncToggle } from '@proton/pass/components/Settings/AliasSyncToggle';
import { Domains } from '@proton/pass/components/Settings/Aliases/Domains';
import { AliasMailboxes } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxes';

export const Aliases: FC = () => (
    <>
        <Domains />
        <AliasMailboxes />
        <AliasSyncToggle />
    </>
);
