import { useState } from 'react';

import { useLoading } from '@proton/hooks';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { CreateBitcoinTokenData, createToken } from '@proton/shared/lib/api/payments';
import { MAX_BITCOIN_AMOUNT, MIN_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';

import { AmountAndCurrency } from '../../payments/core';

export interface BitcoinTokenModel {
    amountBitcoin: number;
    address: string;
    token: string | null;
    amount: number;
    currency: string | null;
}

const useBitcoin = (api: Api, { Amount: amount, Currency: currency }: AmountAndCurrency) => {
    const silentApi = getSilentApi(api);

    const [error, setError] = useState(false);
    const INITIAL_STATE: BitcoinTokenModel = { amountBitcoin: 0, address: '', token: null, amount: 0, currency: null };
    const [model, setModel] = useState(INITIAL_STATE);
    const [loading, withLoading] = useLoading();

    const fetchAsToken = async () => {
        try {
            const data: CreateBitcoinTokenData = {
                Amount: amount,
                Currency: currency,
                Payment: {
                    Type: 'cryptocurrency',
                    Details: {
                        Coin: 'bitcoin',
                    },
                },
            };
            const { Token, Data } = await silentApi<any>(createToken(data));
            setModel({
                amountBitcoin: Data.CoinAmount,
                address: Data.CoinAddress,
                token: Token,
                amount: amount,
                currency: currency,
            });
        } catch (error) {
            setModel(INITIAL_STATE);
            throw error;
        }
    };

    const request = async () => {
        const isCorrectAmount = amount >= MIN_BITCOIN_AMOUNT && amount <= MAX_BITCOIN_AMOUNT;
        const alreadyHasToken = model.amount === amount && model.currency === currency && !!model.token;
        if (!isCorrectAmount || alreadyHasToken) {
            return;
        }

        setError(false);
        try {
            await withLoading(fetchAsToken());
        } catch {
            setError(true);
        }
    };

    return {
        model,
        loading,
        request,
        error,
        amount,
        currency,
    };
};

export default useBitcoin;
