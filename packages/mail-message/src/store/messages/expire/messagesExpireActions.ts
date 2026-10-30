import { createAsyncThunk } from '@reduxjs/toolkit';

import { setExpiration } from '@proton/shared/lib/api/messages';

import type { MessagesThunkExtra } from '../messagesTypes';

export const expireMessages = createAsyncThunk<
    Promise<void>,
    { IDs: string[]; conversationID?: string; expirationTime: number | null },
    MessagesThunkExtra
>('messages/setExpiration', async ({ IDs, expirationTime }, { extra }) => {
    await extra.api(setExpiration(IDs, expirationTime));
    await extra.eventManager.call();
});
