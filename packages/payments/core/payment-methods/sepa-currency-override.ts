import { PAYMENT_METHOD_TYPES } from '../constants';
import { type Currency, type PaymentMethodType } from '../interface';

export const getIsCurrencyOverriden = ({
    currentCurrency,
    currencyBeforeOverride,
}: {
    currentCurrency: Currency;
    currencyBeforeOverride: Currency | undefined;
}) => !!currencyBeforeOverride && currentCurrency !== currencyBeforeOverride;

export const SEPA_CURRENCY = 'EUR';

export const updateCurrencyOverride = ({
    currentCurrency,
    currencyBeforeOverride,
    currentSelectedMethod,
    newSelectedMethod,
}: {
    currentCurrency: Currency;
    currencyBeforeOverride: Currency | undefined;
    currentSelectedMethod: PaymentMethodType | undefined;
    newSelectedMethod?: PaymentMethodType;
}):
    | {
          currency: Currency;
          currencyBeforeOverride: Currency | undefined;
      }
    | undefined => {
    const shouldOverrideCurrency =
        currentCurrency !== SEPA_CURRENCY &&
        // the first condition checks if user just selected SEPA_DIRECT_DEBIT
        (newSelectedMethod === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT ||
            // the second condition checks if user already has SEPA_DIRECT_DEBIT. Important: we need to make sure
            // that selectedMethod is undefined. That means that user didn't just select another payment method to
            // switch from SEPA to something else.
            (!newSelectedMethod && currentSelectedMethod === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT));

    // if user currently has SEPA and selects non-SEPA and currency was overriden then we need to change the
    // currency back
    const shouldChangeCurrencyBack =
        getIsCurrencyOverriden({ currentCurrency, currencyBeforeOverride }) &&
        currentSelectedMethod === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT &&
        // make sure that selectedMethod is defined - that means that that's user's action to change the selected
        // method
        !!newSelectedMethod &&
        newSelectedMethod !== PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT;

    if (shouldOverrideCurrency) {
        return {
            currency: SEPA_CURRENCY,
            currencyBeforeOverride: currentCurrency,
        };
    }

    if (shouldChangeCurrencyBack && currencyBeforeOverride) {
        return {
            currency: currencyBeforeOverride,
            currencyBeforeOverride: undefined,
        };
    }
};
