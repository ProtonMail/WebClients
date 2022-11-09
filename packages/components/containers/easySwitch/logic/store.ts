import { useMemo } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';

import { useApi, useEventManager, useNotifications } from '@proton/components';
import { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { Api } from '@proton/shared/lib/interfaces';

import { NotificationsManager } from '../../notifications/manager';
import draft from './draft/draft.slice';
import importers from './importers/importers.slice';
import reports from './reports/reports.slice';

export const useGenerateEasySwitchStore = () => {
    const api = useApi();
    const notificationManager = useNotifications();
    const eventManager = useEventManager();
    const store = useMemo(() => {
        return configureStore({
            reducer: { reports, importers, draft },
            middleware: (getDefaultMiddleware) =>
                getDefaultMiddleware({
                    thunk: { extraArgument: { api, notificationManager, eventManager } },
                }),
        });
    }, []);

    return store;
};

export type EasySwitchState = ReturnType<ReturnType<typeof useGenerateEasySwitchStore>['getState']>;
export type EasySwitchDispatch = ReturnType<typeof useGenerateEasySwitchStore>['dispatch'];
export type EasySwitchThunkExtra = {
    state: EasySwitchState;
    dispatch: EasySwitchDispatch;
    extra: { api: Api; notificationManager: NotificationsManager; eventManager: EventManager };
};

export const useEasySwitchDispatch: () => EasySwitchDispatch = useDispatch;
export const useEasySwitchSelector: TypedUseSelectorHook<EasySwitchState> = useSelector;
