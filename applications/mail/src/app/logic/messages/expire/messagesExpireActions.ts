import { createAsyncThunk } from '@reduxjs/toolkit';

import { setExpiration } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';

export const expireMessages = createAsyncThunk<
    Promise<void>,
    { IDs: string[]; conversationID?: string; expirationTime: number | null; api: Api; call: () => Promise<void> }
>('messages/setExpiration', async ({ IDs, expirationTime, api, call }) => {
    await api(setExpiration(IDs, expirationTime));
    await call();
});
