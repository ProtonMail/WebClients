import { configureStore } from '@reduxjs/toolkit';
import elements from './elements/elementsSlice';
import attachments from './attachments/attachmentsSlice';
import conversations from './conversations/conversationsSlice';

export const store = configureStore({
    reducer: {
        elements,
        conversations,
        attachments,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoreState: true,
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.abortController', 'meta.arg.api', 'payload.attachment'],
            },
        }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
