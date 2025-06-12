import { type ExtractIBANResult, extractIBAN as ibantoolsExtractIBAN } from 'ibantools';

import orderBy from '@proton/utils/orderBy';

import { PAYMENT_METHOD_TYPES } from './constants';
import type { PaymentMethodSepa, SavedPaymentMethod } from './interface';

// non-EU countries require Address Line 1
// https://docs.stripe.com/sources/sepa-debit#custom-client-side-source-creation
const ibanCountriesThatRequireAddress = new Set([
    'AD',
    'PF',
    'TF',
    'GI',
    'GB',
    'GG',
    'VA',
    'IM',
    'JE',
    'MC',
    'NC',
    'BL',
    'PM',
    'SM',
    'CH',
    'WF',
]);

function checkIfIbanCountryRequiresAddress(ibanCountryCode: string | undefined): boolean {
    return !!ibanCountryCode && ibanCountriesThatRequireAddress.has(ibanCountryCode);
}

export type ExtendedExtractIBANResult = ExtractIBANResult & {
    requiresAddress: boolean;
};

export function extractIBAN(iban: string): ExtendedExtractIBANResult {
    const result = ibantoolsExtractIBAN(iban);
    return {
        ...result,
        requiresAddress: checkIfIbanCountryRequiresAddress(result.countryCode),
    };
}

// SEPA helper. Can be removed if the API consistently returns the type of save SEPA in both cases: GET events and GET methods

function isSavedPaymentMethodSepa(obj: any): obj is PaymentMethodSepa {
    return (
        obj.Type === 'sepa-direct-debit' ||
        obj.Type === 'sepadirectdebit' ||
        (obj.Type === 'sepa_direct_debit' && !!obj.Details)
    );
}

export function formatPaymentMethod(method: SavedPaymentMethod): SavedPaymentMethod {
    if (isSavedPaymentMethodSepa(method)) {
        return {
            ...method,
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        } as PaymentMethodSepa;
    }
    return method;
}

export function markDefaultPaymentMethod(paymentMethods: SavedPaymentMethod[]): SavedPaymentMethod[] {
    if (!paymentMethods || paymentMethods.length === 0) {
        return paymentMethods;
    }

    const sortedPaymentMethods = orderBy(paymentMethods, 'Order');

    return sortedPaymentMethods.map(
        (paymentMethod, index) =>
            ({
                ...paymentMethod,
                IsDefault: index === 0,
            }) as SavedPaymentMethod
    );
}

export function formatPaymentMethods(paymentMethods: SavedPaymentMethod[]): SavedPaymentMethod[] {
    return markDefaultPaymentMethod(paymentMethods.map(formatPaymentMethod));
}
