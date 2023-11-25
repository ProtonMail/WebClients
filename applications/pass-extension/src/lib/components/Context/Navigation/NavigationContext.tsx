import { type FC, createContext, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';

import type { LocationDraftState } from '@proton/pass/hooks/useItemDraft';
import { isEditItemDraft, isNewItemDraft } from '@proton/pass/lib/items/item.predicates';
import { selectLatestDraft } from '@proton/pass/store/selectors';
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
    const history = useHistory<LocationDraftState>();
    const [selectedItem, setSelectedItem] = useState<Maybe<SelectedItem>>(undefined);

    const inTrash = useRouteMatch('/trash') !== null;
    const isEditing = history.location.pathname.includes('/edit');
    const isCreating = history.location.pathname.includes('/new');

    /** Get the latest draft on first load - the equality check
     * function is set to never react to subsequent draft updates.
     * FIXME: When we get to drafts v2, we can remove the draft
     * effects from the `NavigationContextProvider` */
    const draft = useSelector(selectLatestDraft, () => true);

    const selectItem = useCallback((shareId: string, itemId: string, options?: NavigationOptions) => {
        setSelectedItem({ shareId, itemId });
        history[options?.action ?? 'push'](`${options?.inTrash ? '/trash' : ''}/share/${shareId}/item/${itemId}`);
    }, []);

    const unselectItem = useCallback((options?: NavigationOptions) => {
        setSelectedItem(undefined);
        history[options?.action ?? 'push'](options?.inTrash ? '/trash' : '');
    }, []);

    useEffect(() => {
        const { selectedItem } = popup.state.initial;
        if (selectedItem) selectItem(selectedItem.shareId, selectedItem.itemId, { action: 'replace' });

        /** When supporting drafts v2: remove these as we will be able to leverage
         * the full draft state and give the user more control over the drafts */
        if (isNewItemDraft(draft)) history.push(`/item/new/${draft.type}`, { draft: draft });
        if (isEditItemDraft(draft)) history.push(`/share/${draft.shareId}/item/${draft.itemId}/edit`, { draft: draft });
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
