import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { CreateFilter, Filter } from '@proton/components/containers/filters/interfaces';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    addTreeFilter,
    deleteFilter as deleteFilterConfig,
    toggleEnable,
    updateFilter as updateFilterConfig,
} from '@proton/shared/lib/api/filters';

import { type MailFiltersState, filtersActions } from './index';

export const addFilter = ({
    filter,
}: {
    filter: CreateFilter;
}): ThunkAction<Promise<Filter>, MailFiltersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const { Filter } = await extra.api<{ Filter: Filter }>(addTreeFilter(filter));
        dispatch(filtersActions.upsertFilter(Filter));
        return Filter;
    };
};

export const updateFilter = ({
    id,
    filter,
}: {
    id: string;
    filter: CreateFilter;
}): ThunkAction<Promise<Filter>, MailFiltersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const { Filter } = await extra.api<{ Filter: Filter }>(updateFilterConfig(id, filter));
        dispatch(filtersActions.upsertFilter(Filter));
        return Filter;
    };
};

export const deleteFilter = ({
    filter,
}: {
    filter: Filter;
}): ThunkAction<Promise<void>, MailFiltersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        await extra.api(deleteFilterConfig(filter.ID));
        dispatch(filtersActions.deleteFilter(filter));
    };
};

export const enableFilter = ({
    filter,
    enabled,
}: {
    filter: Filter;
    enabled: boolean;
}): ThunkAction<Promise<void>, MailFiltersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const { Filter } = await extra.api<{ Filter: Filter }>(toggleEnable(filter.ID, enabled));
        dispatch(filtersActions.upsertFilter(Filter));
    };
};
