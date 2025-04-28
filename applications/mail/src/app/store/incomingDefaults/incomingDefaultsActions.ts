import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import {
    addIncomingDefault,
    deleteIncomingDefaults,
    getIncomingDefaults,
} from '@proton/shared/lib/api/incomingDefaults';
import { INCOMING_DEFAULTS_LOCATION } from '@proton/shared/lib/constants';
import type { IncomingDefault } from '@proton/shared/lib/interfaces';

import type { IncomingDefaultEvent } from '../../models/event';
import type { MailThunkExtra } from '../store';
import type { IncomingDefaultsState } from './incomingDefaultsTypes';

type LoadResults = Pick<IncomingDefaultsState, 'list'>;

interface ApiResult {
    IncomingDefaults: IncomingDefault[];
    Total: number;
    GlobalTotal: number;
}

const LOAD_BY_CHUNKS_SIZE = 100;
export const loadIncomingDefaults = createAsyncThunk<LoadResults, undefined, MailThunkExtra>(
    'incomingDefaults/load',
    async (_, thunkApi) => {
        const list: IncomingDefault[] = [];
        let count = 0;
        let page = 0;
        const api = thunkApi.extra.api;

        do {
            try {
                const result = await api<ApiResult>(
                    getIncomingDefaults({
                        Page: page,
                        PageSize: LOAD_BY_CHUNKS_SIZE,
                        // Load only the blocked ones for perf reasons
                        Location: INCOMING_DEFAULTS_LOCATION.BLOCKED,
                    })
                );
                list.push(...(result.IncomingDefaults || []));
                count = result.Total;
                page += 1;
            } catch (error: any | undefined) {
                console.error(error);
                throw error;
            }
        } while (count > list.length);

        return {
            list,
            count,
        };
    }
);

export const event = createAction<IncomingDefaultEvent>('incomingDefaults/event');

interface AddBlockAddressesParams {
    addresses: string[];
    overwrite?: boolean;
}

export const addBlockAddresses = createAsyncThunk<IncomingDefault[], AddBlockAddressesParams, MailThunkExtra>(
    'incomingDefaults/addBlockAddresses',
    async ({ addresses, overwrite }, thunkApi) => {
        const promises = addresses.map((address) => {
            return thunkApi.extra.api<{ IncomingDefault: IncomingDefault }>(
                addIncomingDefault({
                    Email: address,
                    Location: INCOMING_DEFAULTS_LOCATION.BLOCKED,
                    Overwrite: overwrite,
                })
            );
        });

        let incomingDefaults: IncomingDefault[] = [];

        const results = await Promise.all(promises);
        incomingDefaults = results.map((result) => result.IncomingDefault);

        return incomingDefaults;
    }
);

export const remove = createAsyncThunk<
    { ID: string }[],
    {
        ID: string;
    },
    MailThunkExtra
>('incomingDefaults/remove', async ({ ID }, thunkApi) => {
    const result = await thunkApi.extra.api<{ Responses: { ID: string }[] }>(deleteIncomingDefaults([ID]));

    return result.Responses;
});
