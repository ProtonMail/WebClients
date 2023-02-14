import { createAsyncThunk } from '@reduxjs/toolkit';

import { setExpiration } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';

export const expireMessages = createAsyncThunk<void, { IDs: string[]; expirationTime: number | null; api: Api }>(
    'messages/expire',
    async ({ IDs, expirationTime, api }) => {
        await api(setExpiration(IDs, expirationTime));
    }
);
