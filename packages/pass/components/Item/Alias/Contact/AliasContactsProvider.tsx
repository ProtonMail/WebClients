import type { FC, PropsWithChildren } from 'react';
import { useMemo } from 'react';

import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';

import { AliasContactsContext, type AliasContactsContextValue } from './AliasContactsContext';

export const AliasContactsProvider: FC<PropsWithChildren> = ({ children }) => {
    const { selectedItem } = useNavigation();

    const context = useMemo<AliasContactsContextValue>(
        () => ({
            shareId: selectedItem?.shareId!,
            itemId: selectedItem?.itemId!,
        }),
        [selectedItem]
    );
    return <AliasContactsContext.Provider value={context}>{children}</AliasContactsContext.Provider>;
};
