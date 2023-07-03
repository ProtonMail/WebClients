import { type MouseEvent, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { popupMessage, sendMessage } from '@proton/pass/extension/message';
import { popupTabStateSave } from '@proton/pass/store/actions/creators/popup';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { type ItemRevision, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { isEmptyString } from '@proton/pass/utils/string';

import type { NavigationOptions } from '../context/navigation/NavigationContext';
import { useItemsFilteringContext } from './useItemsFilteringContext';
import { useNavigationContext } from './useNavigationContext';
import { usePopupContext } from './usePopupContext';

export const useSelectItemClick = () => {
    const popup = usePopupContext();
    const dispatch = useDispatch();
    const { selectItem } = useNavigationContext();
    const { search } = useItemsFilteringContext();

    return useCallback(
        (item: ItemRevision, options?: NavigationOptions) => (evt: MouseEvent<HTMLElement>) => {
            evt.preventDefault();
            selectItem(item.shareId, item.itemId, options);

            dispatch(
                popupTabStateSave({
                    tabId: popup.context!.tabId,
                    domain: popup.url.subdomain ?? popup.url.domain ?? null,
                    selectedItem: { shareId: item.shareId, itemId: item.itemId },
                    search,
                })
            );

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
        []
    );
};
