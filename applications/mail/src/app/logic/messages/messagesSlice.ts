import { createSlice } from '@reduxjs/toolkit';
import { MessagesState } from './messagesTypes';

const messagesSlice = createSlice({
    name: 'messages',
    initialState: {} as MessagesState,
    reducers: {},
    extraReducers: (builder) => {
        console.log(builder);
    },
});

// Export the reducer, either as a default or named export
export default messagesSlice.reducer;
