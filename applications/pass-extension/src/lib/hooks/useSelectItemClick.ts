import { type MouseEvent, useCallback } from 'react';

import type { NavigationOptions } from 'proton-pass-extension/lib/components/Context/Navigation/NavigationContext';

import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { type ItemRevision, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
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
