import { configureStore } from '@reduxjs/toolkit';
import elements from './elements/elementsSlice';
import attachments from './attachments/attachmentsSlice';
import conversations from './conversations/conversationsSlice';
import messages from './messages/messagesSlice';
import contacts from './contacts/contactsSlice';

export const store = configureStore({
    reducer: {
        elements,
        conversations,
        attachments,
        messages,
        contacts,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
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

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
