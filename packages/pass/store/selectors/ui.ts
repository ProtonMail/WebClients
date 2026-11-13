import type { UIStateNamespace, UIStateValue } from '../reducers';
import type { State } from '../types';

export const selectUIStateValue =
    (namespace: UIStateNamespace, key: string, persist: boolean) =>
    (state: State): UIStateValue | undefined =>
        state.ui[persist ? 'persisted' : 'session'][namespace]?.[key];
