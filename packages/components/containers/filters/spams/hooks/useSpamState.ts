import { Reducer, useCallback, useReducer } from 'react';

import { SpamItem, SpamLocation, SpamNavItem } from '../Spams.interfaces';

interface State {
    display: SpamNavItem;
    search: string | undefined;
    list: SpamItem[];
    total: number;
    globalTotal: number;
    modal: SpamLocation | undefined;
    status: 'loading' | 'noResults' | 'displayResults';
    page: number;
}

type Action =
    | { type: 'setDisplay'; payload: State['display'] }
    | { type: 'setSearch'; payload: State['search'] }
    | { type: 'setList'; payload: Pick<State, 'list' | 'total' | 'globalTotal'> }
    | { type: 'setModal'; payload: SpamLocation }
    | { type: 'refetchList' }
    | { type: 'loading'; payload: boolean }
    | { type: 'fetchList' }
    | { type: 'setPage'; payload: number };

const INITIAL_PAGE = 1;

const reducer =
    (fetchSpams: (args: State) => void) =>
    (state: State, action: Action): State => {
        switch (action.type) {
            case 'fetchList':
                fetchSpams(state);
                return state;
            case 'setList':
                const nextStatus: State['status'] = action.payload.list.length ? 'displayResults' : 'noResults';
                return {
                    ...state,
                    globalTotal: action.payload.globalTotal,
                    list: action.payload.list,
                    status: nextStatus,
                    total: action.payload.total,
                };
            case 'setSearch':
                if (state.search === action.payload) {
                    return state;
                }
                const setSearchState: State = {
                    ...state,
                    list: [],
                    page: INITIAL_PAGE,
                    search: action.payload || undefined,
                    status: 'loading',
                    total: 0,
                };
                fetchSpams(setSearchState);

                return setSearchState;
            case 'setDisplay':
                if (state.display === action.payload) {
                    return state;
                }

                const setDisplayState: State = {
                    ...state,
                    display: action.payload,
                    list: [],
                    page: INITIAL_PAGE,
                    status: 'loading',
                    total: 0,
                };
                fetchSpams(setDisplayState);

                return setDisplayState;
            case 'setModal':
                return { ...state, modal: action.payload };
            case 'refetchList':
                const refetchListState: State = {
                    ...state,
                    list: [],
                    status: 'loading',
                    total: 0,
                };
                fetchSpams(refetchListState);

                return refetchListState;
            case 'loading':
                return {
                    ...state,
                    status:
                        // eslint-disable-next-line no-nested-ternary
                        action.payload === true ? 'loading' : state.list.length > 0 ? 'displayResults' : 'noResults',
                };
            case 'setPage':
                const setPageState: State = {
                    ...state,
                    list: [],
                    page: action.payload,
                    status: 'loading',
                    total: 0,
                };
                fetchSpams(setPageState);

                return setPageState;
            default:
                throw new Error('unknown action');
        }
    };

const useSpamState = (fetchSpams: (args: State) => void) => {
    // In order to avoid double calls we need to memoize this callback
    const reducerMemoized = useCallback(reducer(fetchSpams), []);

    return useReducer<Reducer<State, Action>>(reducerMemoized, {
        display: 'ALL',
        globalTotal: 0,
        list: [],
        modal: undefined,
        page: INITIAL_PAGE,
        search: '',
        status: 'loading',
        total: 0,
    });
};

export default useSpamState;
