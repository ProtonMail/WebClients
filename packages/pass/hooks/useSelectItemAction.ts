import { useCallback, useRef } from 'react';

import type { ItemSelectOptions } from '@proton/pass/components/Navigation/NavigationActions';
import { useSelectItem } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import type { ItemRevision, Maybe, SelectedItem } from '@proton/pass/types';
import { B2BEventName } from '@proton/pass/types/data/b2b';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { usePassCore } from '../components/Core/PassCoreProvider';
import { itemEq } from '../lib/items/item.predicates';
import { isEmptyString } from '../utils/string/is-empty-string';

type SelectItemActionDeps = {
    search: string;
    selectedItem: Maybe<SelectedItem>;
};

/** Wraps the base `NavigationContextValue::selectItem` function and adds
 * telemetry event dispatches depending on the current filtering context.
 * Returned function is stable. */
export const useSelectItemAction = () => {
    const { onTelemetry, onB2BEvent } = usePassCore();
    const selectItem = useSelectItem();

    const selectedItem = useSelectedItem();
    const { filters } = useNavigationFilters();
    const { search } = filters;

    /** Keep a stable ref instead of passing dependencies to
     * returned `useCallback` to avoid re-renders */
    const ref = useRef<SelectItemActionDeps>({ search, selectedItem });
    ref.current.search = search;
    ref.current.selectedItem = selectedItem;

    return useCallback((item: ItemRevision, options: ItemSelectOptions) => {
        /* noop if item is already selected */
        if (ref.current.selectedItem && itemEq(ref.current.selectedItem)(item)) return;

        const { itemId, shareId } = item;
        const { type } = item.data;

        selectItem(shareId, itemId, options);

        onTelemetry(TelemetryEventName.ItemRead, {}, { type: TelemetryItemType[type] });
        onB2BEvent({ name: B2BEventName.ItemRead, timestamp: getEpoch(), itemId, shareId });
        if (!isEmptyString(ref.current.search)) onTelemetry(TelemetryEventName.SearchClick, {}, {});
    }, []);
};
