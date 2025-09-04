import { useEffect, useMemo, useState } from 'react';

import orderBy from 'lodash/orderBy';
import pick from 'lodash/pick';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import { c } from 'ttag';

import type {
    WasmApiCountry,
    WasmFiatCurrencySymbol,
    WasmGatewayProvider,
    WasmPaymentMethod,
    WasmQuote,
} from '@proton/andromeda';
import { useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import {
    type GetQuotesArgs,
    resetQuotesByProvider,
    useCountriesByProvider,
    useExchangeRate,
    useFiatCurrenciesByProvider,
    useGetQuotesByProvider,
    useWalletDispatch,
} from '@proton/wallet/store';

import { BUY_BITCOIN_DEFAULT_AMOUNT } from '../../../constants/amount';
import { useDebounceEffect } from '../../../utils/hooks/useDebouncedEffect';
import { getGatewayNameByGatewayProvider } from '../../../utils/onramp';

export type QuoteWithProvider = WasmQuote & {
    provider: WasmGatewayProvider;
};
interface Props {
    country: WasmApiCountry;
    preselectedQuote?: QuoteWithProvider;
}

export const useAmountStep = ({ country: inputCountry, preselectedQuote }: Props) => {
    const [selectedCountry, setSelectedCountry] = useState<WasmApiCountry>(inputCountry);
    const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(preselectedQuote?.FiatCurrencySymbol);
    const [exchangeRate] = useExchangeRate(selectedCurrency as WasmFiatCurrencySymbol);

    const [error, setError] = useState<String | undefined>(undefined);

    const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<WasmGatewayProvider | undefined>(
        preselectedQuote?.provider
    );
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<WasmPaymentMethod | undefined>(
        preselectedQuote?.PaymentMethod
    );
    const { createNotification } = useNotifications();
    const [loadingQuotes, withLoadingQuotes] = useLoading();

    const [sortedQuotes, setSortedQuotes] = useState<QuoteWithProvider[]>([]);
    const selectedQuote = useMemo(
        () =>
            sortedQuotes.find(
                (q) => q.PaymentMethod === selectedPaymentMethod && q.provider === selectedPaymentProvider
            ),
        [selectedPaymentMethod, selectedPaymentProvider, sortedQuotes]
    );

    const [amount, setAmount] = useState(BUY_BITCOIN_DEFAULT_AMOUNT);

    const [countriesByProviders, loadingCountries] = useCountriesByProvider();
    const [fiatCurrenciesByProvider, loadingCurrencies] = useFiatCurrenciesByProvider();

    const getQuotesByProviders = useGetQuotesByProvider();
    const dispatch = useWalletDispatch();

    const allCountries = useMemo(
        () => uniqBy(Object.values(countriesByProviders ?? {}).flat(), (country) => country.Code),
        [countriesByProviders]
    );
    const allCountryOptions = useMemo(
        () => allCountries.map((country) => ({ countryCode: country.Code, countryName: country.Name })),
        [allCountries]
    );

    const allCurrencies = useMemo(() => {
        const providersSupportingSelectedCountry = Object.entries(countriesByProviders ?? {})
            .filter(([, countries]) => countries.some((country) => country.Code === selectedCountry.Code))
            .map(([provider]) => provider);

        // We only want to keep providers supporting selected country, so that we only propose currencies
        const providersSubset = pick(fiatCurrenciesByProvider, providersSupportingSelectedCountry);

        // We sort by MinimumAmount DESC to display all possible quotes
        const sortedCurrencies = orderBy(
            Object.values(providersSubset).flat(),
            ({ MinimumAmount }) => Number(MinimumAmount) || 0,
            ['desc']
        );

        return uniqBy(sortedCurrencies, (c) => c.Symbol);
    }, [countriesByProviders, fiatCurrenciesByProvider, selectedCountry.Code]);

    useEffect(() => {
        if (selectedPaymentProvider && sortedQuotes.length) {
            const bestProviderQuote = sortedQuotes.find((q) => q.provider === selectedPaymentProvider);
            if (bestProviderQuote) {
                setSelectedPaymentMethod(bestProviderQuote.PaymentMethod);
            }
        }
    }, [selectedPaymentProvider, sortedQuotes]);

    useEffect(() => {
        setSelectedCurrency((selectedCountry.FiatCurrency ?? 'USD') as WasmFiatCurrencySymbol);
    }, [selectedCountry.FiatCurrency]);

    const run = async () => {
        if (selectedCurrency && amount) {
            setError(undefined);

            const args: GetQuotesArgs = [amount, selectedCurrency];

            try {
                const quotes = await getQuotesByProviders(args);
                const sortedQuotes = Object.entries(quotes ?? {})
                    .flatMap(([provider, quotes]) =>
                        quotes.map((quote) => ({
                            provider: provider as WasmGatewayProvider,
                            ...quote,
                        }))
                    )
                    .filter((quote) => Number(quote.FiatAmount) === Number(amount))
                    .sort((quoteA, quoteB) => {
                        if (quoteA.provider === 'Azteco' && quoteB.provider !== 'Azteco') {
                            return -1;
                        }
                        if (quoteA.provider !== 'Azteco' && quoteB.provider === 'Azteco') {
                            return 1;
                        }
                        return quoteA.BitcoinAmount <= quoteB.BitcoinAmount ? 1 : -1;
                    });
                setSortedQuotes(sortedQuotes);

                const [bestQuote] = sortedQuotes;
                setSelectedPaymentProvider(bestQuote.provider);
                setSelectedPaymentMethod(bestQuote.PaymentMethod);
                setError(undefined);
            } catch (error: any) {
                setSortedQuotes([]);
                setSelectedPaymentProvider(undefined);
                setSelectedPaymentMethod(undefined);
                createNotification({
                    type: 'warning',
                    text:
                        error.error ??
                        c('Bitcoin buy')
                            .t`The selected currency is not supported in your country or the requested amount is too low`,
                });
                setError(c('Bitcoin buy').t`No quote available for the requested amount`);
            }
        }
    };

    useDebounceEffect(() => {
        void withLoadingQuotes(run());
    }, [createNotification, amount, getQuotesByProviders, selectedCurrency, withLoadingQuotes]);

    const availableProviders = useMemo(() => {
        return uniqBy(sortedQuotes, (q) => q.provider).map((q) => q.provider);
    }, [sortedQuotes]);

    const availablePaymentMethods = useMemo(() => {
        return uniq(sortedQuotes.filter((q) => q.provider === selectedPaymentProvider).map((q) => q.PaymentMethod));
    }, [selectedPaymentProvider, sortedQuotes]);

    const providerName = getGatewayNameByGatewayProvider(selectedPaymentProvider);

    const resetQuoteByProvider = () => {
        dispatch(resetQuotesByProvider());
        void withLoadingQuotes(run());
    };

    return {
        // Amount
        setAmount,
        amount,
        exchangeRate,

        // Currency
        selectedCurrency,
        allCurrencies,
        loadingCurrencies,
        setSelectedCurrency,

        // Country
        selectedCountry,
        allCountries,
        allCountryOptions,
        loadingCountries,
        setSelectedCountry,

        // Payment
        selectedPaymentMethod,
        availablePaymentMethods,
        setSelectedPaymentMethod,

        // Provider
        selectedPaymentProvider,
        availableProviders,
        providerName,
        setSelectedPaymentProvider,

        // Quote
        loadingQuotes,
        selectedQuote,

        // Reset redux store
        resetQuoteByProvider,

        // Error
        error,
    };
};
