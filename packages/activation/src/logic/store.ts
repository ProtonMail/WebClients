import { useMemo } from 'react';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';

import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import type { EventLoop } from '@proton/account/eventLoop';
import { useApi, useEventManager, useNotifications } from '@proton/components';
import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { Api } from '@proton/shared/lib/interfaces';

import imapDraft from './draft/imapDraft/imapDraft.slice';
import oauthDraft from './draft/oauthDraft/oauthDraft.slice';
import importers from './importers/importers.slice';
import reports from './reports/reports.slice';
import sync from './sync/sync.slice';

export const listenerMiddleware = createListenerMiddleware();

export const useGenerateEasySwitchStore = () => {
    const api = useApi();
    const notificationManager = useNotifications();
    const eventManager = useEventManager();
    const store = useMemo(() => {
        return configureStore({
            devTools: process.env.NODE_ENV !== 'production',
            reducer: { reports, importers, sync, oauthDraft, imapDraft },
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware({
                    thunk: { extraArgument: { api, notificationManager, eventManager } },
                }).prepend(listenerMiddleware.middleware),
        });
    }, []);

    return store;
};

export type EasySwitchState = ReturnType<ReturnType<typeof useGenerateEasySwitchStore>['getState']>;
type EasySwitchDispatch = ReturnType<typeof useGenerateEasySwitchStore>['dispatch'];
export type EasySwitchThunkExtra = {
    state: EasySwitchState;
    dispatch: EasySwitchDispatch;
    extra: { api: Api; notificationManager: NotificationsManager; eventManager: EventManager<EventLoop> };
};

export const useEasySwitchDispatch: () => EasySwitchDispatch = useDispatch;
export const useEasySwitchSelector: TypedUseSelectorHook<EasySwitchState> = useSelector;
