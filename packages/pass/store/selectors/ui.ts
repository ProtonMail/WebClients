import type { UIStateValue } from '../reducers';
import type { State } from '../types';

export const selectUIStateValue =
    (key: string) =>
    (state: State): UIStateValue | undefined =>
        state.ui.values[key];
