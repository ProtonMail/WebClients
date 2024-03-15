import { useEffect } from 'react';

import { baseUseSelector } from '@proton/redux-shared-store';
import { useWalletSettings } from '@proton/wallet';

import { useGetExchangeRate } from '../store/hooks';
import { exchangeRateSimpleSelector } from '../store/hooks/useExchangeRate';

export const useUserExchangeRate = () => {
    const [walletSettings] = useWalletSettings();
    const getExchangeRate = useGetExchangeRate();

    useEffect(() => {
        if (walletSettings?.FiatCurrency) {
            void getExchangeRate({ thunkArg: [walletSettings.FiatCurrency] });
        }
    }, [walletSettings?.FiatCurrency, getExchangeRate]);

    return baseUseSelector(exchangeRateSimpleSelector);
};
