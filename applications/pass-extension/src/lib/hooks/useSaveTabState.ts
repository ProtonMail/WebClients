import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { saveTabState } from '@proton/pass/store/actions/creators/filters';
import { intoDomainWithPort } from '@proton/pass/utils/url/utils';

export const useSaveTabState = () => {
    const { getExtensionClientState } = usePassCore();
    const { tabId } = useExtensionContext();
    const { filters } = useNavigationFilters();
    const selectedItem = useSelectedItem();

    const dispatch = useDispatch();

    const { itemId, shareId } = selectedItem ?? {};
    const { search, sort, type, selectedShareId } = filters;

    const savePopupState = useRef(false);

    const popupTabState = useMemo(() => {
        const url = getExtensionClientState?.()?.url;
        return {
            domain: url ? intoDomainWithPort({ ...url, as: 'host' }) : null,
            filters: { search, sort, type, selectedShareId },
            search,
            selectedItem: selectedItem ? { shareId: selectedItem.shareId, itemId: selectedItem.itemId } : null,
            tabId,
        };
    }, [itemId, shareId, search, sort, type, selectedShareId]);

    useEffect(() => {
        if (!savePopupState.current) savePopupState.current = true;
        else dispatch(saveTabState(popupTabState));
    }, [popupTabState]);
};
