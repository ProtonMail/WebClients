import { useRef } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector, useStore } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';

import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { Api } from '@proton/shared/lib/interfaces';

import attachments from './attachments/attachmentsSlice';
import composers from './composers/composersSlice';
import contacts from './contacts/contactsSlice';
import conversations from './conversations/conversationsSlice';
import elements from './elements/elementsSlice';
import incomingDefaults from './incomingDefaults/incomingDefaultsSlice';
import messages from './messages/messagesSlice';

const thunkExtraArgs = {} as unknown as AppThunkExtra['extra'];

/**
 * Set thunk extra args needed at the `MainContainer` app level.
 * @warning use this method at the top of the app before store context is initialized.
 * @warning dont dispatch async thunks usind those extra args before this hook is runned
 */
export const useSetReduxThunkExtraArgs = () => {
    const api = useApi();
    const notifications = useNotifications();
    const eventManager = useEventManager();

    /**
     * https://beta.reactjs.org/reference/react/useRef#avoiding-recreating-the-ref-contents
     */
    const thunkExtraArgsDefined = useRef(false);
    if (!thunkExtraArgsDefined.current) {
        thunkExtraArgsDefined.current = true;
        Object.assign(thunkExtraArgs, { api, notifications, eventManager });
    }
};

/**
 * Typing has to be tweaked here. Store is generated inside a hook
 * to add utils inside thunk middleware.
 * Those utils depends on other react contexts.
 */
export const store = configureStore({
    reducer: {
        elements,
        conversations,
        attachments,
        messages,
        contacts,
        incomingDefaults,
        composers,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: { extraArgument: thunkExtraArgs },
            // Serialization checks have to be restored
            // But we need some kind of regex ignore capacities
            serializableCheck: {
                // Ignore these field paths in state
                // ignoredPaths: [],

                // TODO
                ignoreState: true,

                // Ignore these field paths in all actions
                ignoredActionPaths: [
                    'meta.arg',
                    'payload.abortController',
                    'payload.preparation',
                    'payload.decryption',
                    'payload',
                    'payload.attachment',

                    'payload.contacts',
                    'payload.contactGroups',
                ],

                warnAfter: 100,
            },
        }),
});

type Store = typeof store;
export type RootState = ReturnType<Store['getState']>;
export type AppDispatch = Store['dispatch'];
export type AppThunkExtra = {
    state: RootState;
    dispatch: AppDispatch;
    extra: {
        api: Api;
        notifications: ReturnType<typeof useNotifications>;
        eventManager: ReturnType<typeof useEventManager>;
    };
};

export const useAppStore: () => Store = useStore;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
