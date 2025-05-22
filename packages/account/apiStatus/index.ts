import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface ApiStatusState {
    offline: boolean;
    /** message explaining why API is unreachable */
    apiUnreachable: string;
    appVersionBad: boolean;
}

export const defaultApiStatus: ApiStatusState = {
    offline: false,
    apiUnreachable: '',
    appVersionBad: false,
};

const name = 'apiStatus' as const;

export interface ApiStatusReducerState {
    [name]: ApiStatusState;
}

const slice = createSlice({
    name,
    initialState: defaultApiStatus,
    reducers: {
        update: (state, action: PayloadAction<Partial<ApiStatusState>>) => {
            state.appVersionBad = action.payload?.appVersionBad || defaultApiStatus.appVersionBad;
            state.apiUnreachable = action.payload?.apiUnreachable || defaultApiStatus.apiUnreachable;
            state.offline = action.payload?.offline || defaultApiStatus.offline;
        },
    },
});

export const apiStatusActions = slice.actions;
export const apiStatusReducer = { [name]: slice.reducer };
