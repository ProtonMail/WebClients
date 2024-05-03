import { useCallback } from 'react';

import type { ItemSelectOptions } from '@proton/pass/components/Navigation/NavigationProvider';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import type { ItemRevision } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';

import { usePassCore } from '../components/Core/PassCoreProvider';
import { itemEq } from '../lib/items/item.predicates';
import { isEmptyString } from '../utils/string/is-empty-string';

/** Wraps the base `NavigationContextValue::selectItem` function and adds
 * telemetry event dispatches depending on the current filtering context. */
export const useSelectItemAction = () => {
    const { onTelemetry } = usePassCore();
    const { selectItem, filters, selectedItem } = useNavigation();
    const { search } = filters;

    return useCallback(
        (item: ItemRevision, options: ItemSelectOptions) => {
            /* noop if item is already selected */
            if (selectedItem && itemEq(selectedItem)(item)) return;

            const { itemId, shareId } = item;
            const { type } = item.data;

            selectItem(shareId, itemId, options);

            onTelemetry(TelemetryEventName.ItemRead, {}, { type: TelemetryItemType[type] });
            if (!isEmptyString(search)) onTelemetry(TelemetryEventName.SearchClick, {}, {});
        },
        [search, selectedItem]
    );
};
