import { configureStore } from '@reduxjs/toolkit';
import elements from './elements/elementsSlice';

export const store = configureStore({
    reducer: {
        elements,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
