import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface OrganizationTheme {
    logoURL: string;
    showName: boolean;
    name: string;
    access: boolean;
}

const name = 'organizationTheme';

const defaultState: OrganizationTheme = {
    logoURL: '',
    showName: false,
    name: '',
    access: false,
};

export const organizationThemeSlice = createSlice({
    name,
    initialState: defaultState,
    reducers: {
        set(state, action: PayloadAction<OrganizationTheme>) {
            return action.payload;
        },
        reset(state, action: PayloadAction<{ access: boolean }>) {
            return {
                ...defaultState,
                access: action.payload.access,
            };
        },
    },
});

export const selectOrganizationTheme = (state: { [name]: OrganizationTheme }) => state[name];
