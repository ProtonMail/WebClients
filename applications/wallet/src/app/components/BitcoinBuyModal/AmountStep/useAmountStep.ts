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
import type { GetQuotesArgs } from '@proton/wallet/store';
import {
    useCountriesByProvider,
    useExchangeRate,
    useFiatCurrenciesByProvider,
    useGetQuotesByProvider,
} from '@proton/wallet/store';

import { useDebounceEffect } from '../../../utils/hooks/useDebouncedEffect';
import { getGatewayNameByGatewayProvider } from '../../../utils/onramp';

export type QuoteWithProvider = WasmQuote & {
    provider: WasmGatewayProvider;
};
interface Props {
    country: WasmApiCountry;
    preselectedQuote?: QuoteWithProvider;
}

const DEFAULT_AMOUNT = 100;

export const useAmountStep = ({ country: inputCountry, preselectedQuote }: Props) => {
    const [selectedCountry, setSelectedCountry] = useState<WasmApiCountry>(inputCountry);
    const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(preselectedQuote?.FiatCurrencySymbol);
    const [exchangeRate] = useExchangeRate(selectedCurrency as WasmFiatCurrencySymbol);

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

    const [amount, setAmount] = useState(DEFAULT_AMOUNT);

    const [countriesByProviders, loadingCountries] = useCountriesByProvider();
    const [fiatCurrenciesByProvider, loadingCurrencies] = useFiatCurrenciesByProvider();

    const getQuotesByProviders = useGetQuotesByProvider();

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

    useDebounceEffect(() => {
        const run = async () => {
            if (selectedCurrency && amount) {
                const args: GetQuotesArgs = [amount, selectedCurrency];

                const quotes = await getQuotesByProviders(args);
                const sortedQuotes = Object.entries(quotes ?? {})
                    .flatMap(([provider, quotes]) =>
                        quotes.map((quote) => ({
                            provider: provider as WasmGatewayProvider,
                            ...quote,
                        }))
                    )
                    .sort((quoteA, quoteB) => (quoteA.BitcoinAmount < quoteB.BitcoinAmount ? 1 : -1));

                if (sortedQuotes.length) {
                    setSortedQuotes(sortedQuotes);

                    const [bestQuote] = sortedQuotes;
                    setSelectedPaymentProvider(bestQuote.provider);
                    setSelectedPaymentMethod(bestQuote.PaymentMethod);
                } else {
                    setSortedQuotes([]);
                    setSelectedPaymentProvider(undefined);
                    setSelectedPaymentMethod(undefined);

                    createNotification({
                        type: 'warning',
                        text: c('Bitcoin buy')
                            .t`The selected currency is not supported in your country or the requested amount is too low`,
                    });
                }
            }
        };

        void withLoadingQuotes(run());
    }, [createNotification, amount, getQuotesByProviders, selectedCurrency, withLoadingQuotes]);

    const availableProviders = useMemo(() => {
        return uniqBy(sortedQuotes, (q) => q.provider).map((q) => q.provider);
    }, [sortedQuotes]);

    const availablePaymentMethods = useMemo(() => {
        return uniq(sortedQuotes.filter((q) => q.provider === selectedPaymentProvider).map((q) => q.PaymentMethod));
    }, [selectedPaymentProvider, sortedQuotes]);

    const providerName = getGatewayNameByGatewayProvider(selectedPaymentProvider);

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
    };
};
