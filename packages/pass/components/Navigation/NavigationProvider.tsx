import type { PropsWithChildren } from 'react';
import type { FC } from 'react';

import { NavigationItem } from '@proton/pass/components/Navigation/NavigationItem';

import { NavigationActionsProvider } from './NavigationActions';
import { NavigationFilters } from './NavigationFilters';
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
