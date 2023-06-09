import { type FC, createContext, useCallback, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import type { Maybe, SelectedItem } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type NavigationOptions = { inTrash?: boolean; action?: 'replace' | 'push' };

export type NavigationContextValue = {
    selectedItem: Maybe<SelectedItem>;
    selectItem: (shareId: string, itemId: string, options?: NavigationOptions) => void;
    unselectItem: (options?: NavigationOptions) => void;
    inTrash: boolean;
    isEditing: boolean;
    isCreating: boolean;
};

export const NavigationContext = createContext<NavigationContextValue>({
    selectedItem: undefined,
    selectItem: noop,
    unselectItem: noop,
    inTrash: false,
    isEditing: false,
    isCreating: false,
});

export const NavigationContextProvider: FC = ({ children }) => {
    const history = useHistory();
    const [selectedItem, setSelectedItem] = useState<Maybe<SelectedItem>>(undefined);

    const inTrash = useRouteMatch('/trash') !== null;
    const isEditing = history.location.pathname.includes('/edit');
    const isCreating = history.location.pathname.includes('/new');

    const selectItem = useCallback((shareId: string, itemId: string, options?: NavigationOptions) => {
        setSelectedItem({ shareId, itemId });
        history[options?.action ?? 'push'](`${options?.inTrash ? '/trash' : ''}/share/${shareId}/item/${itemId}`);
    }, []);

    const unselectItem = useCallback((options?: NavigationOptions) => {
        setSelectedItem(undefined);
        history[options?.action ?? 'push'](options?.inTrash ? '/trash' : '');
    }, []);

    return (
        <NavigationContext.Provider
            value={{
                selectedItem,
                inTrash,
                isEditing,
                isCreating,
                selectItem,
                unselectItem,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};
