import { useCallback } from 'react';

import type { Store } from '@reduxjs/toolkit';

import { baseUseStore } from '@proton/react-redux-store/ProtonStoreContext';

import { allMessages, localID, messageByID } from '../../store/messages/messagesSelectors';
import type { MessagesStoreState } from '../../store/messages/messagesTypes';

const useMessagesStore = baseUseStore.withTypes<Store<MessagesStoreState>>();

export const useGetLocalID = () => {
    const store = useMessagesStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-3CD77B
    return useCallback((ID: string) => localID(store.getState(), { ID }), []);
};

export const useGetMessage = () => {
    const store = useMessagesStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-422E9C
    return useCallback((ID: string) => messageByID(store.getState(), { ID }), []);
};

export const useGetAllMessages = () => {
    const store = useMessagesStore();
    return useCallback(() => {
        return allMessages(store.getState());
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-B335AA
    }, []);
};
