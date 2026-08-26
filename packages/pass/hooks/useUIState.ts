import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setUIStateValue, unsetUIStateValue } from '../store/actions/creators/ui';
import type { UIStateValue } from '../store/reducers';
import { selectUIStateValue } from '../store/selectors/ui';

/** Persists a piece of UX-only UI state (eg. an expanded/collapsed section,
 * a last-active tab) so it survives the extension popup being closed and reopened.
 *  Excluded from the persisted cache. */
export const useUIState = <T extends UIStateValue>(key: string, defaultValue: T) => {
    const dispatch = useDispatch();
    const value = useSelector(selectUIStateValue(key)) as T | undefined;

    const setValue = useCallback(
        (next: T) =>
            dispatch(next === defaultValue ? unsetUIStateValue({ key }) : setUIStateValue({ key, value: next })),
        [key, defaultValue, dispatch]
    );

    return [value ?? defaultValue, setValue] as const;
};
