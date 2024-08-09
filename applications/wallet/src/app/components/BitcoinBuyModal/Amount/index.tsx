import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { compact, orderBy, pick, uniq, uniqBy } from 'lodash';
import { c } from 'ttag';

import type {
    WasmApiCountry,
    WasmFiatCurrencySymbol,
    WasmGatewayProvider,
    WasmPaymentMethod,
    WasmQuote,
} from '@proton/andromeda';
import type { IconName } from '@proton/components/components';
import { DropdownSizeUnit, Icon, useModalState } from '@proton/components/components';
import CountrySelect from '@proton/components/components/country/CountrySelect';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import banxaLogo from '@proton/styles/assets/img/brand/banxa.svg';
import moonpayLogo from '@proton/styles/assets/img/brand/moonpay.svg';
import rampLogo from '@proton/styles/assets/img/brand/ramp.svg';

import type { CoreSearchableSelectProps } from '../../../atoms';
import { Button, Input, SearchableSelect, Select } from '../../../atoms';
import { CurrencySelect } from '../../../atoms/CurrencySelect';
import { useCountriesByProvider } from '../../../store/hooks/useCountriesByProvider';
import { useFiatCurrenciesByProvider } from '../../../store/hooks/useFiatCurrenciesByProvider';
import { useGetQuotesByProvider } from '../../../store/hooks/useQuotesByProvider';
import type { GetQuotesArgs } from '../../../store/slices/quotesByProvider';
import { useDebounceEffect } from '../../../utils/hooks/useDebouncedEffect';
import { DisclaimerModal } from './DisclaimerModal';

export type QuoteWithProvider = WasmQuote & {
    provider: WasmGatewayProvider;
};
interface Props {
    onConfirm: (quote: QuoteWithProvider) => void;
    country: WasmApiCountry;
    preselectedQuote?: QuoteWithProvider;
}

const getContentForProvider = (provider: WasmGatewayProvider) => {
    switch (provider) {
        case 'Banxa':
            return {
                title: 'Banxa',
                assetSrc: banxaLogo,
            };
        case 'Ramp':
            return {
                title: 'Ramp',
                assetSrc: rampLogo,
            };
        case 'MoonPay':
            return {
                title: 'MoonPay',
                assetSrc: moonpayLogo,
            };
        default:
            return null;
    }
};

const getContentForPaymentMethod = (paymentMethod: WasmPaymentMethod): { text: string; icon: IconName } | null => {
    switch (paymentMethod) {
        case 'ApplePay':
            return {
                text: 'ApplePay',
                icon: 'brand-apple',
            };
        case 'BankTransfer':
            return {
                text: c('bitcoin buy').t`Bank transfer`,
                icon: 'pass-credit-card',
            };
        case 'Card':
            return {
                text: c('bitcoin buy').t`Credit card`,
                icon: 'credit-card',
            };
        case 'GooglePay':
            return {
                text: 'GooglePay',
                icon: 'pass-json',
            };
        case 'InstantPayment':
            return {
                text: c('bitcoin buy').t`Instant payment`,
                icon: 'bolt-filled',
            };
        default:
            return null;
    }
};

const DEFAULT_AMOUNT = 100;

export const Amount = ({ onConfirm, country: inputCountry, preselectedQuote }: Props) => {
    const [selectedCountry, setSelectedCountry] = useState<WasmApiCountry>(inputCountry);
    const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(preselectedQuote?.FiatCurrencySymbol);
    const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<WasmGatewayProvider | undefined>(
        preselectedQuote?.provider
    );
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<WasmPaymentMethod | undefined>(
        preselectedQuote?.PaymentMethod
    );
    const { createNotification } = useNotifications();
    const [loadingQuotes, withLoadingQuotes] = useLoading();
    const [disclaimerModal, setDisclaimerModal] = useModalState();

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
                    // TODO: add notification here
                    setSortedQuotes([]);
                    setSelectedPaymentProvider(undefined);
                    setSelectedPaymentMethod(undefined);

                    createNotification({
                        type: 'warning',
                        text: c('Bitcoin buy').t`We could not find any quote for this currency/country pair`,
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

    return (
        <>
            <div className="flex flex-column max-w-full justify-center items-center">
                <h2 className="text-center mb-4 text-semibold">{c('bitcoin buy').t`Amount`}</h2>

                <div className="w-full flex flex-column gap-2">
                    <CountrySelect
                        label={null}
                        value={{ countryCode: selectedCountry.Code, countryName: selectedCountry.Name }}
                        onSelectCountry={(code) => {
                            const country = allCountries.find((country) => country.Code === code);
                            if (country) {
                                setSelectedCountry(country);
                            }
                        }}
                        disabled={loadingCountries || loadingQuotes}
                        options={allCountryOptions}
                        as={(props: CoreSearchableSelectProps<string>) => (
                            <SearchableSelect
                                label={c('bitcoin buy').t`Your location`}
                                placeholder={c('bitcoin buy').t`Choose a country`}
                                {...props}
                            />
                        )}
                        assistContainerClassName="empty:hidden"
                    />

                    <InputFieldStackedGroup>
                        <Input
                            isGroupElement
                            label={c('bitcoin buy').t`You pay`}
                            value={amount}
                            type="number"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setAmount(Number(e.target.value));
                            }}
                            className="invisible-number-input-arrow"
                            disabled={loadingQuotes}
                            suffix={
                                <div className="flex grow items-center flex-row flex-nowrap">
                                    <CurrencySelect
                                        dense
                                        value={selectedCurrency as string}
                                        disabled={loadingCurrencies}
                                        options={allCurrencies}
                                        stackedFieldWrapper={false}
                                        onSelect={(currency) => {
                                            setSelectedCurrency(currency.Symbol as WasmFiatCurrencySymbol);

                                            const amount = Number(currency.MinimumAmount);
                                            setAmount(Number.isFinite(amount) ? amount : DEFAULT_AMOUNT);
                                        }}
                                    />
                                </div>
                            }
                        />

                        <Input
                            isGroupElement
                            label={c('bitcoin buy').t`You receive`}
                            readOnly
                            value={selectedQuote?.BitcoinAmount && `${selectedQuote?.BitcoinAmount} BTC`}
                            disabled={loadingQuotes}
                            suffix={
                                (availableProviders.length || !loadingQuotes) && (
                                    <div className="flex grow items-center flex-row flex-nowrap">
                                        <Select
                                            value={selectedPaymentProvider}
                                            onChange={(event) => {
                                                setSelectedPaymentProvider(event.value);
                                            }}
                                            size={{
                                                width: DropdownSizeUnit.Dynamic,
                                                maxWidth: DropdownSizeUnit.Viewport,
                                            }}
                                            containerClassName="provider-select-dense"
                                            stackedFieldWrapper={false}
                                            renderSelected={(provider) => {
                                                if (!provider) {
                                                    return null;
                                                }

                                                const content = getContentForProvider(provider);

                                                if (!content) {
                                                    return null;
                                                }

                                                return (
                                                    <div className="flex flex-row items-center">
                                                        <img
                                                            src={content.assetSrc}
                                                            style={{ width: '1.25rem' }}
                                                            alt=""
                                                            className="mr-2"
                                                        />
                                                        <span className="text-sm">{content.title}</span>
                                                    </div>
                                                );
                                            }}
                                            options={compact(
                                                availableProviders.map((provider) => {
                                                    const content = getContentForProvider(provider);

                                                    if (!content) {
                                                        return null;
                                                    }

                                                    return {
                                                        value: provider,
                                                        label: provider,
                                                        id: provider,
                                                        children: (
                                                            <div className="flex flex-row items-center">
                                                                <div
                                                                    className="p-2 mr-2 flex rounded-full bg-weak border-norm"
                                                                    style={{ width: '2rem', height: '2rem' }}
                                                                >
                                                                    <img src={content.assetSrc} alt="" />
                                                                </div>
                                                                <span>{content.title}</span>
                                                            </div>
                                                        ),
                                                    };
                                                })
                                            )}
                                        />
                                    </div>
                                )
                            }
                        />
                    </InputFieldStackedGroup>

                    <InputFieldStackedGroup>
                        <Select
                            prefix={(() => {
                                if (!selectedPaymentMethod) {
                                    return undefined;
                                }

                                const content = getContentForPaymentMethod(selectedPaymentMethod);

                                if (!content) {
                                    return undefined;
                                }

                                return (
                                    <div className="p-3 rounded-full bg-norm flex items-center justify-center mr-2">
                                        <Icon size={4} name={content.icon} className="color-weak" />
                                    </div>
                                );
                            })()}
                            label={c('bitcoin buy').t`Pay with`}
                            disabled={!selectedPaymentProvider || loadingQuotes}
                            value={selectedPaymentMethod}
                            onChange={(e) => {
                                setSelectedPaymentMethod(e.value);
                            }}
                            options={compact(
                                availablePaymentMethods.map((paymentMethod) => {
                                    const content = getContentForPaymentMethod(paymentMethod);
                                    if (!content) {
                                        return null;
                                    }

                                    return {
                                        value: paymentMethod,
                                        id: paymentMethod,
                                        label: content.text,
                                    };
                                })
                            )}
                        />
                    </InputFieldStackedGroup>

                    <div className="w-full px-8 my-5">
                        <Button
                            fullWidth
                            shape="solid"
                            color="norm"
                            size="large"
                            disabled={!selectedQuote || loadingQuotes}
                            onClick={() => {
                                setDisclaimerModal(true);
                            }}
                        >
                            {!!selectedPaymentProvider
                                ? c('bitcoin buy').t`Continue with ${selectedPaymentProvider}`
                                : c('bitcoin buy').t`Continue`}
                        </Button>
                    </div>
                </div>
            </div>

            {selectedPaymentProvider && (
                <DisclaimerModal
                    provider={selectedPaymentProvider}
                    onConfirm={() => {
                        if (selectedQuote) {
                            onConfirm(selectedQuote);
                        }

                        disclaimerModal.onClose();
                    }}
                    {...disclaimerModal}
                />
            )}
        </>
    );
};
