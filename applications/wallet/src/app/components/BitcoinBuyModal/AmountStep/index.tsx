import { type ChangeEvent, useState } from 'react';

import compact from 'lodash/compact';
import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import type {
    WasmApiCountry,
    WasmFiatCurrencySymbol,
    WasmGatewayProvider,
    WasmPaymentMethod,
    WasmQuote,
} from '@proton/andromeda';
import type { IconName } from '@proton/components';
import { useNotifications } from '@proton/components';
import { useSubscriptionModal } from '@proton/components';
import { DropdownSizeUnit, Icon, useModalState } from '@proton/components';
import CountrySelect from '@proton/components/components/country/CountrySelect';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import useLoading from '@proton/hooks/useLoading';
import { PLANS } from '@proton/payments';
import aztecoLogo from '@proton/styles/assets/img/brand/azteco.svg';
import banxaLogo from '@proton/styles/assets/img/brand/banxa.svg';
import moonpayLogo from '@proton/styles/assets/img/brand/moonpay.svg';
import rampLogo from '@proton/styles/assets/img/brand/ramp.svg';
import { useWalletApiClients } from '@proton/wallet';

import type { CoreSearchableSelectProps } from '../../../atoms';
import { Button, Input, SearchableSelect, Select } from '../../../atoms';
import { CurrencySelect } from '../../../atoms/CurrencySelect';
import { Skeleton } from '../../../atoms/Skeleton';
import { BUY_BITCOIN_DEFAULT_AMOUNT } from '../../../constants/amount';
import { countDecimal, formatNumberForDisplay } from '../../../utils';
import { AztecoPaymentDetailsModal } from './AztecoPaymentDetailsModal';
import { DisclaimerModal } from './DisclaimerModal';
import { useAmountStep } from './useAmountStep';

export type QuoteWithProvider = WasmQuote & {
    provider: WasmGatewayProvider;
};
interface Props {
    onConfirm: (quote: QuoteWithProvider, checkoutId: string | null) => void;
    country: WasmApiCountry;
    preselectedQuote?: QuoteWithProvider;
    btcAddress: string;
}

const getContentForProvider = (provider: WasmGatewayProvider) => {
    switch (provider) {
        case 'Azteco':
            return {
                title: 'Azteco',
                assetSrc: aztecoLogo,
            };
        case 'Banxa':
            return {
                title: 'Banxa',
                assetSrc: banxaLogo,
            };
        case 'Ramp':
            return {
                title: 'Ramp Network',
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

export const AmountStep = ({ onConfirm, country: inputCountry, preselectedQuote, btcAddress }: Props) => {
    const [loadingConfirm, withLoadingConfirm] = useLoading();
    const walletApi = useWalletApiClients();

    const {
        // Amount
        setAmount,
        amount,

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
    } = useAmountStep({ country: inputCountry, preselectedQuote });

    const [disclaimerModal, setDisclaimerModal] = useModalState();
    const [aztecoPaymentDetailsModal, setAztecoPaymentDetailsModal] = useModalState();

    const [digitsAfterDecimalPoint, setDigitsAfterDecimalPoint] = useState<number>(countDecimal(amount.toString()));

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        const countDigit = countDecimal(newValue);
        if (countDigit > 2) {
            return;
        }
        setDigitsAfterDecimalPoint(countDecimal(newValue));

        setAmount(Number(event.target.value));
    };

    const [user] = useUser();
    const [organization] = useOrganization();
    const currentPlan = organization?.PlanName;

    const [openSubscriptionModal] = useSubscriptionModal();

    const { createNotification } = useNotifications();

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
                            error={error}
                            value={`${formatNumberForDisplay(amount, 2, digitsAfterDecimalPoint)}`}
                            type="number"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                onChange(e);
                            }}
                            className="invisible-number-input-arrow"
                            disabled={loadingQuotes}
                            suffix={
                                <div className="flex grow items-center flex-row flex-nowrap">
                                    <CurrencySelect
                                        dense
                                        value={selectedCurrency as string}
                                        disabled={loadingCurrencies || loadingQuotes}
                                        options={allCurrencies}
                                        stackedFieldWrapper={false}
                                        onSelect={(currency) => {
                                            setSelectedCurrency(currency.Symbol as WasmFiatCurrencySymbol);
                                            const amount = Number(currency.MinimumAmount);
                                            setAmount(
                                                Number.isFinite(amount) && Number(amount) > BUY_BITCOIN_DEFAULT_AMOUNT
                                                    ? amount
                                                    : BUY_BITCOIN_DEFAULT_AMOUNT
                                            );
                                        }}
                                    />
                                </div>
                            }
                        />

                        <Skeleton loading={loadingQuotes}>
                            <Input
                                isGroupElement
                                label={c('bitcoin buy').t`You receive`}
                                readOnly
                                value={
                                    !error && selectedQuote?.BitcoinAmount ? `${selectedQuote?.BitcoinAmount} BTC` : ''
                                }
                                disabled={loadingQuotes || error}
                                subline={
                                    selectedPaymentProvider === 'Azteco' &&
                                    selectedQuote &&
                                    !loadingQuotes && (
                                        <div className="flex flex-row items-center text-sm text-weak">
                                            {selectedQuote.PurchaseAmount} {selectedQuote.FiatCurrencySymbol}
                                            <span className="block mx-1">|</span>
                                            <Button
                                                shape="underline"
                                                color="weak"
                                                onClick={() => setAztecoPaymentDetailsModal(true)}
                                                style={{ padding: 0 }}
                                            >
                                                {c('bitcoin buy').t`See details`}
                                            </Button>
                                        </div>
                                    )
                                }
                                suffix={
                                    (availableProviders.length || !loadingQuotes) && (
                                        <div className="flex grow items-center flex-row flex-nowrap">
                                            {!loadingQuotes && selectedPaymentProvider === 'Azteco' && (
                                                <span className={'azteco-recommended-label'}>Recommended</span>
                                            )}
                                            <Skeleton loading={loadingQuotes}>
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
                                                    disabled={!availableProviders.length}
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
                                                                            style={{
                                                                                width: '2rem',
                                                                                height: '2rem',
                                                                            }}
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
                                            </Skeleton>
                                        </div>
                                    )
                                }
                            />
                        </Skeleton>
                    </InputFieldStackedGroup>

                    <InputFieldStackedGroup>
                        <Skeleton loading={loadingQuotes && availablePaymentMethods.length > 0}>
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
                                        <Skeleton loading={loadingQuotes}>
                                            <div className="p-3 rounded-full bg-norm flex items-center justify-center mr-2">
                                                <Icon size={4} name={content.icon} className="color-weak" />
                                            </div>
                                        </Skeleton>
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
                                ).sort((a, b) => a.label.localeCompare(b.label))}
                            />
                        </Skeleton>
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
                                ? selectedPaymentProvider === 'Azteco'
                                    ? c('bitcoin buy').t`Buy Azteco vouchers`
                                    : c('bitcoin buy').t`Continue with ${providerName}`
                                : c('bitcoin buy').t`Continue`}
                        </Button>
                    </div>
                </div>
            </div>

            {selectedPaymentProvider && (
                <DisclaimerModal
                    provider={selectedPaymentProvider}
                    loading={loadingConfirm}
                    onConfirm={() =>
                        withLoadingConfirm(
                            (async () => {
                                if (selectedQuote) {
                                    try {
                                        const clientSecret =
                                            selectedQuote.OrderID && selectedQuote?.provider === 'Azteco'
                                                ? await walletApi.payment_gateway.createOnRampCheckout(
                                                      selectedQuote.FiatAmount,
                                                      btcAddress,
                                                      selectedQuote.FiatCurrencySymbol,
                                                      selectedQuote.PaymentMethod,
                                                      'Azteco',
                                                      selectedQuote.OrderID
                                                  )
                                                : null;

                                        onConfirm(selectedQuote, clientSecret);
                                    } catch (error: any) {
                                        createNotification({
                                            type: 'error',
                                            text: c('bitcoin buy')
                                                .t`An error occurred while confirming this quote, please select another provider and try again.`,
                                        });
                                    }
                                }

                                disclaimerModal.onClose();
                            })()
                        )
                    }
                    {...disclaimerModal}
                />
            )}

            {selectedPaymentProvider === 'Azteco' && selectedQuote && (
                <AztecoPaymentDetailsModal
                    selectedQuote={selectedQuote}
                    amountToPay={amount}
                    btcAmountToReceive={Number(selectedQuote?.BitcoinAmount ?? 0)}
                    hasWalletPaidPlans={currentPlan === PLANS.VISIONARY}
                    user={user}
                    openSubscriptionModal={openSubscriptionModal}
                    resetQuoteByProvider={resetQuoteByProvider}
                    {...aztecoPaymentDetailsModal}
                />
            )}
        </>
    );
};
