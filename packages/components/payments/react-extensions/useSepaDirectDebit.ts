import { useEffect, useRef, useState } from 'react';

import { electronicFormatIBAN } from 'ibantools';

import type { DirectDebitBankAccount, DirectDebitCustomer, DirectDebitCustomerNameType } from '@proton/chargebee/lib';
import { useLoading } from '@proton/hooks';
import {
    type ADDON_NAMES,
    type AmountAndCurrency,
    type ChargeableV5PaymentParameters,
    type ChargebeeFetchedPaymentToken,
    type ChargebeeIframeEvents,
    type ChargebeeIframeHandles,
    type ForceEnableChargebee,
    PAYMENT_METHOD_TYPES,
    PAYMENT_TOKEN_STATUS,
    type PLANS,
    type PaymentVerificatorV5,
    type V5PaymentToken,
    convertPaymentIntentData,
} from '@proton/payments';
import { type CreatePaymentIntentDirectDebitData, fetchPaymentIntentV5 } from '@proton/shared/lib/api/payments';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';
import type { Api, User } from '@proton/shared/lib/interfaces';

import type { PaymentProcessorHook, PaymentProcessorType } from './interface';

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
    onProcessPaymentToken?: (paymentMethodType: PaymentProcessorType) => void;
    onProcessPaymentTokenFailed?: (paymentMethodType: PaymentProcessorType) => void;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    user: User | undefined;
    onBeforeSepaPayment?: () => Promise<boolean>;
}

export interface Dependencies {
    api: Api;
    events: ChargebeeIframeEvents;
    handles: ChargebeeIframeHandles;
    forceEnableChargebee: ForceEnableChargebee;
    verifyPayment: PaymentVerificatorV5;
}

type Overrides = {};

export type ChargebeeDirectDebitProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    bankAccount: DirectDebitBankAccount;
    setBankAccount: React.Dispatch<React.SetStateAction<DirectDebitBankAccount>>;
    customer: DirectDebitCustomer;
    setCompanyName: (company: string) => void;
    setFirstName: (firstName: string) => void;
    setLastName: (lastName: string) => void;
    setCustomerNameType: (customerNameType: DirectDebitCustomerNameType) => void;
    setEmail: (email: string) => void;
    setCountryCode: (countryCode: string) => void;
    setAddressLine1: (addressLine1: string) => void;
    reset: () => void;
    getFetchedPaymentToken: () => ChargebeeFetchedPaymentToken | null;
} & Overrides;

export const useSepaDirectDebit = (
    { amountAndCurrency, onChargeable, selectedPlanName, user, onBeforeSepaPayment }: Props,
    { api, forceEnableChargebee, handles, verifyPayment, events }: Dependencies
): ChargebeeDirectDebitProcessorHook => {
    const fetchedPaymentTokenRef = useRef<ChargebeeFetchedPaymentToken | null>(null);
    const [bankAccount, setBankAccount] = useState<DirectDebitBankAccount>({ iban: '' });

    const isB2BPlan = getIsB2BAudienceFromPlan(selectedPlanName);

    const [customer, setCustomer] = useState<DirectDebitCustomer>({
        email: user?.Email ?? '',
        company: '',
        firstName: '',
        lastName: '',
        customerNameType: isB2BPlan ? 'company' : 'individual',
        countryCode: 'CH',
        addressLine1: '',
    });

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();

    const processingToken = fetchingToken || verifyingToken;

    const fetchPaymentToken = async () => {
        if (onBeforeSepaPayment) {
            const result = await onBeforeSepaPayment();
            if (!result) {
                return;
            }
        }

        return withFetchingToken(async () => {
            const payload: CreatePaymentIntentDirectDebitData = {
                ...amountAndCurrency,
                Payment: {
                    Type: 'sepa_direct_debit',
                    Details: {
                        Email: customer.email,
                    },
                },
            };

            const { Token: PaymentToken, Status, Data: bePaymentIntentData } = await fetchPaymentIntentV5(api, payload);
            forceEnableChargebee();

            const paymentIntent = convertPaymentIntentData(bePaymentIntentData);

            const formattedIban = electronicFormatIBAN(bankAccount.iban) ?? '';

            await handles.submitDirectDebit({
                paymentIntent,
                customer,
                bankAccount: {
                    ...bankAccount,
                    iban: formattedIban,
                },
            });

            const token: ChargebeeFetchedPaymentToken = {
                ...amountAndCurrency,
                PaymentToken,
                v: 5,
                chargeable: Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
                authorized: true,
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            };

            fetchedPaymentTokenRef.current = token;
        });
    };

    const reset = () => {
        fetchedPaymentTokenRef.current = null;
    };

    const tokenCreated = (token?: V5PaymentToken): ChargeableV5PaymentParameters => {
        const result: ChargeableV5PaymentParameters = {
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            chargeable: true,
            ...amountAndCurrency,
            ...token,
            v: 5,
        };

        void onChargeable?.(result);

        return result;
    };

    const verifyPaymentToken = async () => {
        return withVerifyingToken(async () => {
            try {
                if (amountAndCurrency.Amount === 0) {
                    return tokenCreated();
                }

                if (!fetchedPaymentTokenRef.current) {
                    throw new Error('Payment token is not fetched. Please call fetchPaymentToken() first.');
                }

                const token = await verifyPayment({
                    events,
                    v: 5,
                    token: fetchedPaymentTokenRef.current,
                });

                return tokenCreated(token);
            } catch (error) {
                reset();
                throw error;
            }
        });
    };

    const processPaymentToken = async () => {
        if (!fetchedPaymentTokenRef.current) {
            await fetchPaymentToken();
        }

        await verifyPaymentToken();
    };

    const setCustomerProperty = (property: keyof DirectDebitCustomer) => (value: string) => {
        setCustomer((prev) => ({
            ...prev,
            [property]: value,
        }));
    };

    const setCustomerNameType = setCustomerProperty('customerNameType');

    useEffect(() => {
        if (isB2BPlan) {
            setCustomerNameType('company');
        } else {
            setCustomerNameType('individual');
        }
    }, [isB2BPlan]);

    const getFetchedPaymentToken = () => fetchedPaymentTokenRef.current;

    return {
        bankAccount,
        setBankAccount,
        customer,
        setCompanyName: setCustomerProperty('company'),
        setFirstName: setCustomerProperty('firstName'),
        setLastName: setCustomerProperty('lastName'),
        setEmail: setCustomerProperty('email'),
        setCountryCode: setCustomerProperty('countryCode'),
        setAddressLine1: setCustomerProperty('addressLine1'),
        setCustomerNameType,
        processingToken,
        fetchingToken,
        fetchPaymentToken,
        verifyPaymentToken,
        verifyingToken,
        processPaymentToken,
        reset,
        getFetchedPaymentToken,
        meta: {
            type: 'sepadirectdebit',
        },
    };
};
