import type { FC, PropsWithChildren } from 'react';

import { NavigationActionsProvider } from './NavigationActions';
import { NavigationFilters } from './NavigationFilters';
import { NavigationItem } from './NavigationItem';
import { NavigationMatches } from './NavigationMatches';

export const NavigationProvider: FC<PropsWithChildren> = ({ children }) => (
    <NavigationActionsProvider>
        <NavigationFilters>
            <NavigationMatches>
                <NavigationItem>{children}</NavigationItem>
            </NavigationMatches>
        </NavigationFilters>
    </NavigationActionsProvider>
);
