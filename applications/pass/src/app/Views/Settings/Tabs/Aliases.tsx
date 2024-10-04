import { type FC } from 'react';

import { AliasSyncToggle } from '@proton/pass/components/Settings/AliasSyncToggle';
import { AliasMailboxes } from '@proton/pass/components/Settings/Aliases/AliasMailboxes';

export const Aliases: FC = () => (
    <>
        <AliasMailboxes />
        <AliasSyncToggle />
    </>
);
