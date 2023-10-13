import { type FC, createContext, useCallback, useEffect, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';

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
    const popup = usePopupContext();
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

    useEffect(() => {
        const { selectedItem, draft } = popup.state.initial;

        if (selectedItem) selectItem(selectedItem.shareId, selectedItem.itemId, { action: 'replace' });

        if (draft !== null) {
            const { itemId, shareId, type, mode } = draft;
            switch (mode) {
                case 'new':
                    return history.push(`/item/new/${type}`, { draft });
                case 'edit':
                    return history.push(`/share/${shareId}/item/${itemId}/edit`, { draft });
            }
        }
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
