import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { usePopupContext } from 'proton-pass-extension/app/popup/PopupProvider';
import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { isEditItemDraft, isNewItemDraft } from '@proton/pass/lib/items/item.predicates';
import { popupTabStateSave } from '@proton/pass/store/actions/creators/popup';
import { selectLatestDraft } from '@proton/pass/store/selectors';
import { resolveDomain } from '@proton/pass/utils/url/utils';

/** Handles syncing the popup state for the current tab whenever
 * filters or selected item changes. Takes care of handling the
 * initial popup state on first mount: will navigate to the previously
 * selected item and/or re-hydrate the draft view */
export const usePopupStateEffects = () => {
    const { getCurrentTabUrl } = usePassCore();
    const { tabId } = useExtensionContext();
    const popup = usePopupContext();
    const { navigate, selectItem, selectedItem, filters, setFilters } = useNavigation();
    const dispatch = useDispatch();

    /** Get the latest draft on first load - the equality check
     * function is set to never react to subsequent draft updates.
     * FIXME: When we get to drafts v2, we can remove the draft
     * effects from the `NavigationContextProvider` */
    const draft = useSelector(selectLatestDraft, () => true);

    const { itemId, shareId } = selectedItem ?? {};
    const { search, sort, type, selectedShareId } = filters;

    const savePopupState = useRef(false);

    const popupTabState = useMemo(() => {
        const url = getCurrentTabUrl?.();
        return {
            domain: url ? resolveDomain(url) : null,
            filters: { search, sort, type, selectedShareId },
            search,
            selectedItem: selectedItem ? { shareId: selectedItem.shareId, itemId: selectedItem.itemId } : null,
            tabId,
        };
    }, [itemId, shareId, search, sort, type, selectedShareId]);

    useEffect(() => {
        const { initial } = popup;
        const { selectedItem } = initial;
        const filters = { ...initial.filters, search: initial.search ?? '' };

        if (isNewItemDraft(draft)) {
            /** When supporting drafts v2: remove these as we will be able to leverage
             * the full draft state and give the user more control over the drafts */
            return navigate(getLocalPath(`item/new/${draft.type}`), { hash: 'draft', mode: 'push', filters });
        }

        if (isEditItemDraft(draft)) {
            return selectItem(draft.shareId, draft.itemId, { hash: 'draft', mode: 'push', view: 'edit', filters });
        }

        if (selectedItem) selectItem(selectedItem.shareId, selectedItem.itemId, { filters });
        else setFilters(filters);
    }, []);

    useEffect(() => {
        if (!savePopupState.current) savePopupState.current = true;
        else dispatch(popupTabStateSave(popupTabState));
    }, [popupTabState]);
};
