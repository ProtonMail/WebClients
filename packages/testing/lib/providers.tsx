import { ComponentType } from 'react';

import { CacheProvider, NotificationsProvider } from '@proton/components/containers';
import ApiContext from '@proton/components/containers/api/apiContext';
import EventManagerContext from '@proton/components/containers/eventManager/context';
import ModalsContext from '@proton/components/containers/modals/modalsContext';

import { apiMock } from './api';
import { mockCache } from './cache';
import { mockEventManager } from './event-manager';
import { mockModals } from './mockModals';

export const withNotifications =
    () =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <NotificationsProvider>
                <Component {...props} />
            </NotificationsProvider>
        );
    };

export const withDeprecatedModals =
    (value = mockModals) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <ModalsContext.Provider value={value}>
                <Component {...props} />
            </ModalsContext.Provider>
        );
    };

export const withCache =
    (cache = mockCache) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <CacheProvider cache={cache}>
                <Component {...props} />
            </CacheProvider>
        );
    };

export const withApi =
    (api = apiMock) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <ApiContext.Provider value={api}>
                <Component {...props} />
            </ApiContext.Provider>
        );
    };

export const withEventManager =
    (eventManager = mockEventManager) =>
    <T extends {}>(Component: ComponentType<T>) =>
    (props: T & JSX.IntrinsicAttributes) => {
        return (
            <EventManagerContext.Provider value={eventManager}>
                <Component {...props} />
            </EventManagerContext.Provider>
        );
    };
