import { useEffect, useRef, useState } from 'react';

import { electronicFormatIBAN, isValidIBAN } from 'ibantools';
import { c } from 'ttag';

import type { DirectDebitBankAccount, DirectDebitCustomer, DirectDebitCustomerNameType } from '@proton/chargebee/lib';
import { type FormErrorsHook } from '@proton/components/components/v2/useFormErrors';
import { useLoading } from '@proton/hooks';
import {
    type ADDON_NAMES,
    type AmountAndCurrency,
    type ChargeableV5PaymentParameters,
    type ChargebeeFetchedPaymentToken,
    type ChargebeeIframeEvents,
    type ChargebeeIframeHandles,
    DisplayablePaymentError,
    type ExtendedExtractIBANResult,
    type ForceEnableChargebee,
    PAYMENT_METHOD_TYPES,
    PAYMENT_TOKEN_STATUS,
    type PLANS,
    type PaymentVerificatorV5,
    type V5PaymentToken,
    convertPaymentIntentData,
    extractIBAN,
} from '@proton/payments';
import { type CreatePaymentIntentDirectDebitData, fetchPaymentIntentV5 } from '@proton/shared/lib/api/payments';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';
import type { Api } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { PaymentProcessorHook, PaymentProcessorType } from './interface';

export class SepaEmailNotProvidedError extends DisplayablePaymentError {
    constructor() {
        super(c('Info').t`SEPA payments are not available at the moment. Please try again later.`);
        this.name = 'SepaEmailNotProvidedError';
    }
}

export class SepaFormInvalidError extends DisplayablePaymentError {
    constructor() {
        super(c('Info').t`Please fill in all required fields.`);
        this.name = 'SepaFormInvalidError';
    }
}

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
    onProcessPaymentToken?: (paymentMethodType: PaymentProcessorType) => void;
    onProcessPaymentTokenFailed?: (paymentMethodType: PaymentProcessorType) => void;
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    onBeforeSepaPayment?: () => Promise<boolean>;
}

export interface Dependencies {
    api: Api;
    events: ChargebeeIframeEvents;
    handles: ChargebeeIframeHandles;
    forceEnableChargebee: ForceEnableChargebee;
    verifyPayment: PaymentVerificatorV5;
    formErrors: FormErrorsHook;
}

type Overrides = {};

export type ChargebeeDirectDebitProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    bankAccount: DirectDebitBankAccount;
    setBankAccount: React.Dispatch<React.SetStateAction<DirectDebitBankAccount>>;
    customer: DirectDebitCustomerWithoutEmail;
    setCompanyName: (company: string) => void;
    setFirstName: (firstName: string) => void;
    setLastName: (lastName: string) => void;
    setCustomerNameType: (customerNameType: DirectDebitCustomerNameType) => void;
    setEmail: (email: string) => void;
    setCountryCode: (countryCode: string) => void;
    setAddressLine1: (addressLine1: string) => void;
    reset: () => void;
    getFetchedPaymentToken: () => ChargebeeFetchedPaymentToken | null;
    errors: {
        companyError?: string;
        firstNameError?: string;
        lastNameError?: string;
        ibanError?: string;
        addressError?: string;
    };
    ibanStatus: ExtendedExtractIBANResult;
} & Overrides;

type DirectDebitCustomerWithoutEmail = Omit<DirectDebitCustomer, 'email'>;

export const useSepaDirectDebit = (
    { amountAndCurrency, onChargeable, selectedPlanName, onBeforeSepaPayment }: Props,
    { api, forceEnableChargebee, handles, verifyPayment, events, formErrors }: Dependencies
): ChargebeeDirectDebitProcessorHook => {
    const { validator } = formErrors ?? {};

    const fetchedPaymentTokenRef = useRef<ChargebeeFetchedPaymentToken | null>(null);
    const [bankAccount, setBankAccount] = useState<DirectDebitBankAccount>({ iban: '' });

    const isB2BPlan = getIsB2BAudienceFromPlan(selectedPlanName);

    const [customer, setCustomer] = useState<DirectDebitCustomerWithoutEmail>({
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

    const isCompany = customer.customerNameType === 'company';
    const isIndividual = customer.customerNameType === 'individual';

    const ibanStatus = extractIBAN(bankAccount.iban);

    const errors = {
        companyError: isCompany ? validator?.([requiredValidator(customer.company)]) : undefined,
        firstNameError: isIndividual ? validator?.([requiredValidator(customer.firstName)]) : undefined,
        lastNameError: isIndividual ? validator?.([requiredValidator(customer.lastName)]) : undefined,
        ibanError: validator?.([
            requiredValidator(bankAccount.iban),
            isValidIBAN(bankAccount.iban) ? '' : c('Error').t`Invalid IBAN`,
        ]),
        addressError: ibanStatus.requiresAddress ? validator?.([requiredValidator(customer.addressLine1)]) : undefined,
    };

    const validateBeforeSubmit = () => {
        const definedErrors = Object.values(errors).filter(isTruthy);
        if (definedErrors.length === 0) {
            return;
        }

        throw new SepaFormInvalidError();
    };

    const fetchPaymentToken = async () => {
        if (onBeforeSepaPayment) {
            const result = await onBeforeSepaPayment();
            if (!result) {
                return;
            }
        }

        if (!formErrors.onFormSubmit()) {
            return;
        }

        validateBeforeSubmit();

        return withFetchingToken(async () => {
            const payload: CreatePaymentIntentDirectDebitData = {
                ...amountAndCurrency,
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                },
            };

            const { Token: PaymentToken, Status, Data: bePaymentIntentData } = await fetchPaymentIntentV5(api, payload);
            forceEnableChargebee();

            const paymentIntent = convertPaymentIntentData(bePaymentIntentData);
            const sepaEmail = bePaymentIntentData?.Email;
            if (!sepaEmail) {
                throw new SepaEmailNotProvidedError();
            }

            const formattedIban = electronicFormatIBAN(bankAccount.iban) ?? '';

            await handles.submitDirectDebit({
                paymentIntent,
                customer: {
                    ...customer,
                    email: sepaEmail,
                },
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
        errors,
        ibanStatus,
        meta: {
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        },
    };
};
