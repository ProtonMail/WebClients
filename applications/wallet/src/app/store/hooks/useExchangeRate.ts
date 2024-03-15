import { useEffect } from 'react';

import { Action, type ThunkDispatch, createSelector } from '@reduxjs/toolkit';

import { WasmApiExchangeRate, WasmFiatCurrency } from '@proton/andromeda';
import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store';
import { createHooks } from '@proton/redux-utilities';

import { exchangeRateThunk, selectExchangeRate } from '../slices';
import { ExchangeRateState } from '../slices/exchangeRate';
import { WalletThunkArguments } from '../thunk';

const hooks = createHooks(exchangeRateThunk, selectExchangeRate);

export const exchangeRateSimpleSelector = createSelector(
    selectExchangeRate,
    (result): [WasmApiExchangeRate | undefined, boolean] => {
        const { error, value } = result;

        const loading = value === undefined && error === undefined;

        return [value, loading];
    }
);

export const useExchangeRate = (fiat?: WasmFiatCurrency) => {
    const dispatch = baseUseDispatch<ThunkDispatch<ExchangeRateState, WalletThunkArguments, Action>>();

    useEffect(() => {
        void dispatch(exchangeRateThunk({ thunkArg: [fiat] }));
    }, [dispatch, fiat]);

    return baseUseSelector(exchangeRateSimpleSelector);
};

export const useGetExchangeRate = hooks.useGet;
