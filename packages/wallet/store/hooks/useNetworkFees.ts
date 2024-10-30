import { useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import { baseUseSelector } from '@proton/react-redux-store';
import { createHooks } from '@proton/redux-utilities';

import { type FeeSettings, networkFeesThunk, selectNetworkFees } from '../slices';

const hooks = createHooks(networkFeesThunk, selectNetworkFees);

export const useGetNetworkFees = hooks.useGet;

export const useNetworkFees = () => {
    const getNetworkFees = useGetNetworkFees();
    const [, loading] = hooks.useValue();

    const networkFeesSelector = createSelector(selectNetworkFees, (result): [FeeSettings | undefined, boolean] => {
        const { value } = result;

        return [value, loading];
    });

    useEffect(() => {
        void getNetworkFees();
    }, []);

    return baseUseSelector(networkFeesSelector);
};
