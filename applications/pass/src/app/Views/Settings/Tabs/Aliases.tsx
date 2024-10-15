import { type FC } from 'react';

import { AliasSyncToggle } from '@proton/pass/components/Settings/AliasSyncToggle';
import { AliasMailboxes } from '@proton/pass/components/Settings/Aliases/AliasMailboxes';
import { Domains } from '@proton/pass/components/Settings/Aliases/Domains';

export const Aliases: FC = () => (
    <>
        <Domains />
        <AliasMailboxes />
        <AliasSyncToggle />
    </>
);
