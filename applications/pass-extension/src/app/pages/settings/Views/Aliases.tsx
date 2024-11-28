import { type FC } from 'react';

import { Aliases as AliasesCore } from '@proton/pass/components/Settings/Aliases';
import { SpotlightProvider } from '@proton/pass/components/Spotlight/SpotlightProvider';

export const Aliases: FC = () => (
    <SpotlightProvider>
        <AliasesCore />
    </SpotlightProvider>
);
