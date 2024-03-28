// TODO: until design and api changes are made this slice is no longer being used. Data fetching is in BreachAlertsSecurityCenter component.
// import { createSlice } from '@reduxjs/toolkit';
// import type { ModelState, UserState } from 'packages/account';

// import { FetchedBreaches } from '@proton/components/containers/credentialLeak/CredentialLeakSection';
// import { toCamelCase } from '@proton/components/containers/credentialLeak/helpers';
// import type { ProtonThunkArguments } from '@proton/redux-shared-store';
// import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
// import { getBreaches } from '@proton/shared/lib/api/breaches';
// import { Api } from '@proton/shared/lib/interfaces';

// export interface BreachResponse {
//     Breaches: FetchedBreaches[];
//     IsEligible: boolean;
//     Count: number;
// }

// const name = 'breaches';

// const fetchBreachAlerts = (api: Api) =>
//     api(getBreaches()).then(({ Breaches, IsEligible, Count }: BreachResponse) => {
//         const fetchedData = toCamelCase(Breaches);
//         return { Breaches: fetchedData, IsEligible, Count };
//     });

// export interface UserBreachesState extends UserState {
//     [name]: ModelState<BreachResponse>;
// }

// type SliceState = UserBreachesState[typeof name];
// type Model = NonNullable<SliceState['value']>;

// // selectors
// export const selectBreaches = (state: UserBreachesState) => state.breaches;
// export const selectBreachData = (state: UserBreachesState) => state.breaches.value?.Breaches;
// export const selectBreachesCount = (state: UserBreachesState) => state.breaches.value?.Count;
// export const selectBreachesLoading = (state: UserBreachesState) =>
//     state.breaches.value === undefined && state.breaches.error === undefined;
// export const selectBreachesError = (state: UserBreachesState) => state.breaches.error;

// const modelThunk = createAsyncModelThunk<Model, UserBreachesState, ProtonThunkArguments>(`${name}/fetch`, {
//     miss: ({ extraArgument }) => {
//         return fetchBreachAlerts(extraArgument.api);
//     },
//     previous: previousSelector(selectBreaches),
// });

// const initialState: SliceState = {
//     value: undefined,
//     error: undefined,
// };

// const slice = createSlice({
//     name,
//     initialState,
//     reducers: {},
//     extraReducers: (builder) => {
//         handleAsyncModel(builder, modelThunk);
//     },
// });

// export const breachReportsReducer = { [name]: slice.reducer };
// export const breachReportsThunk = modelThunk.thunk;
