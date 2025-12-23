import { createSlice } from '@reduxjs/toolkit';

import { baseUseSelector } from '@proton/react-redux-store';
import type { ProductParam } from '@proton/shared/lib/apps/product';

const name = 'appName' as const;

export const appNameSlice = createSlice({
    name,
    initialState: 'generic',
    reducers: {},
});

export const appNameReducer = { [name]: appNameSlice.reducer };

const selectAppName = (state: { [name]: ProductParam }) => state[name];

export const useAppName = () => baseUseSelector(selectAppName);
