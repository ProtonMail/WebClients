import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setUIStateValue, unsetUIStateValue } from '../store/actions/creators/ui';
import type { UIStateNamespace, UIStateValue } from '../store/reducers';
import { selectUIStateValue } from '../store/selectors/ui';
import type { Maybe } from '../types/utils';

type Options = { persist?: boolean };

/** UX-only UI state (eg. an expanded/collapsed section) kept in the store so it survives the
 * extension popup being closed and reopened. With `persist`, it also survives a restart. */
export const useUIState = <T extends UIStateValue = boolean>(
    namespace: UIStateNamespace,
    key: string,
    defaultValue: NoInfer<T>,
    { persist = false }: Options = {}
) => {
    const dispatch = useDispatch();
    const value = (useSelector(selectUIStateValue(namespace, key, persist)) as Maybe<T>) ?? defaultValue;

    const setValue = useCallback(
        (next: T) => {
            if (next === value) return;
            const target = { namespace, key, persist };
            dispatch(next === defaultValue ? unsetUIStateValue(target) : setUIStateValue({ ...target, value: next }));
        },
        [namespace, key, persist, value, defaultValue]
    );

    return [value, setValue] as const;
};
