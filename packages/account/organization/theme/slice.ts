import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface OrganizationTheme {
    logoURL: string;
    showName: boolean;
    name: string;
    access: boolean;
    enabled: boolean;
}

const name = 'organizationTheme';

const defaultState: OrganizationTheme = {
    logoURL: '',
    showName: false,
    name: '',
    access: false,
    enabled: false,
};

export const organizationThemeSlice = createSlice({
    name,
    initialState: defaultState,
    reducers: {
        set(state, action: PayloadAction<OrganizationTheme>) {
            return action.payload;
        },
        reset(state, action: PayloadAction<{ access: boolean; enabled: boolean }>) {
            return {
                ...defaultState,
                access: action.payload.access,
                enabled: action.payload.enabled,
            };
        },
    },
});

export const selectOrganizationTheme = (state: { [name]: OrganizationTheme }) => state[name];
