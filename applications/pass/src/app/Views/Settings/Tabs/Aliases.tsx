import { type FC } from 'react';

import { AliasMailboxes } from '@proton/pass/components/Settings/AliasMailboxes';
import { AliasSyncToggle } from '@proton/pass/components/Settings/AliasSyncToggle';

export const Aliases: FC = () => (
    <>
        <AliasMailboxes />
        <AliasSyncToggle />
    </>
);
