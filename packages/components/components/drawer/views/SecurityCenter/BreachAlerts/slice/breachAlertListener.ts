// TODO: until design and api changes are made this listener is no longer being used. Data fetching is in BreachAlertsSecurityCenter component.
// import { selectUser } from '@proton/account';
// import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';

// import { UserBreachesState } from './breachReportsSlice';
// import { breachReportsThunk } from './breachReportsSlice';

// export const startBreachAlertListener = (startListening: SharedStartListening<UserBreachesState>) => {
//     startListening({
//         predicate: (action, currentState, nextState) => {
//             const prev = selectUser(currentState);
//             const next = selectUser(nextState);
//             const hasChange = prev.value?.isPaid !== next.value?.isPaid;
//             return hasChange;
//         },
//         effect: async (action, listenerApi) => {
//             await listenerApi.dispatch(breachReportsThunk({ forceFetch: true }));
//         },
//     });
// };
