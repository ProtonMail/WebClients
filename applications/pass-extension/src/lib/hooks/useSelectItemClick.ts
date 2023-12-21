import { useCallback, type MouseEvent } from 'react';

import type { NavigationOptions } from 'proton-pass-extension/lib/components/Context/Navigation/NavigationContext';

import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { WorkerMessageType, type ItemRevision } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import { useItemsFilteringContext } from './useItemsFilteringContext';
import { useNavigationContext } from './useNavigationContext';

export const useSelectItemClick = () => {
    const { selectItem } = useNavigationContext();
    const { search } = useItemsFilteringContext();

    return useCallback(
        (item: ItemRevision, options?: NavigationOptions) => (evt: MouseEvent<HTMLElement>) => {
            evt.preventDefault();
            selectItem(item.shareId, item.itemId, options);

            void sendMessage(
                popupMessage({
                    type: WorkerMessageType.TELEMETRY_EVENT,
                    payload: {
                        event: createTelemetryEvent(TelemetryEventName.ItemRead, {}, { type: TelemetryItemType[item.data.type] }),
                    },
                })
            );

            void (
                !isEmptyString(search) &&
                sendMessage(
                    popupMessage({
                        type: WorkerMessageType.TELEMETRY_EVENT,
                        payload: {
                            event: createTelemetryEvent(TelemetryEventName.SearchClick, {}, { type: TelemetryItemType[item.data.type] }),
                        },
                    })
                )
            );
        },
        [search]
    );
};
