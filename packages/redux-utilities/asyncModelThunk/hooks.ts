import { useCallback, useEffect } from 'react';

import type { ThunkDispatch } from '@reduxjs/toolkit';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import {
    baseUseDispatch as useDispatch,
    baseUseSelector as useSelector,
} from '@proton/redux-shared-store/sharedContext';
import noop from '@proton/utils/noop';

import type { ReducerValue } from './interface';

export const createHooks = <State, Extra, Returned, ThunkArg = void>(
    thunk: (arg?: ThunkArg) => ThunkAction<Promise<Returned>, State, Extra, AnyAction>,
    selector: (state: State) => ReducerValue<Returned>
) => {
    const useGet = (): ((arg?: ThunkArg) => Promise<Returned>) => {
        const dispatch = useDispatch<ThunkDispatch<State, Extra, AnyAction>>();
        return useCallback((arg?: ThunkArg) => dispatch(thunk(arg)), []);
    };

    const useValue = (arg?: ThunkArg): [Returned | undefined, boolean] => {
        const getValue = useGet();
        const selectedValue = useSelector(selector);

        useEffect(() => {
            // It can call getValue even if it's defined, but this is an optimisation to avoid creating extra work
            if (selectedValue.value === undefined && !selectedValue.error) {
                getValue(arg).catch(noop);
            }
        }, [arg]);

        const error = selectedValue.error;
        if (error) {
            const thrownError = new Error(error.message);
            thrownError.name = error.name || thrownError.name;
            thrownError.stack = error.stack || thrownError.stack;
            throw thrownError;
        }

        const result = selectedValue.value;
        const loading = selectedValue.value === undefined;

        return [result, loading];
    };

    return {
        useGet,
        useValue,
    };
};
