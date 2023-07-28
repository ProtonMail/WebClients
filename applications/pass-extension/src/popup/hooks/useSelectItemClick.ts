import { type MouseEvent, useCallback } from 'react';

import { popupMessage, sendMessage } from '@proton/pass/extension/message';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { type ItemRevision, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { isEmptyString } from '@proton/pass/utils/string';

import type { NavigationOptions } from '../context/navigation/NavigationContext';
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
                        event: createTelemetryEvent(TelemetryEventName.ItemRead, {}, { type: item.data.type }),
                    },
                })
            );

            void (
                !isEmptyString(search) &&
                sendMessage(
                    popupMessage({
                        type: WorkerMessageType.TELEMETRY_EVENT,
                        payload: {
                            event: createTelemetryEvent(TelemetryEventName.SearchClick, {}, { type: item.data.type }),
                        },
                    })
                )
            );
        },
        [search]
    );
};
