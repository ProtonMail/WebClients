import { createAsyncThunk } from '@reduxjs/toolkit';

import { setExpiration } from '@proton/shared/lib/api/messages';

import { MailThunkExtra } from '../../store';

export const expireMessages = createAsyncThunk<
    Promise<void>,
    { IDs: string[]; conversationID?: string; expirationTime: number | null },
    MailThunkExtra
>('messages/setExpiration', async ({ IDs, expirationTime }, { extra }) => {
    await extra.api(setExpiration(IDs, expirationTime));
    await extra.eventManager.call();
});
