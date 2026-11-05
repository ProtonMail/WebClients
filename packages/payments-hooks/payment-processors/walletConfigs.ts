import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';

import type { WalletConfig } from './useChargebeeWallet';

export const paypalWalletConfig: WalletConfig = {
    type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
    bePaymentType: 'paypal',
    handles: { initialize: 'initializePaypal', setPaymentIntent: 'setPaypalPaymentIntent' },
    events: {
        authorized: 'onPaypalAuthorized',
        failure: 'onPaypalFailure',
        clicked: 'onPaypalClicked',
        cancelled: 'onPaypalCancelled',
    },
};

export const applePayWalletConfig: WalletConfig = {
    type: PAYMENT_METHOD_TYPES.APPLE_PAY,
    bePaymentType: PAYMENT_METHOD_TYPES.APPLE_PAY,
    handles: { initialize: 'initializeApplePay', setPaymentIntent: 'setApplePayPaymentIntent' },
    events: {
        authorized: 'onApplePayAuthorized',
        failure: 'onApplePayFailure',
        clicked: 'onApplePayClicked',
        cancelled: 'onApplePayCancelled',
    },
};

export const googlePayWalletConfig: WalletConfig = {
    type: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
    bePaymentType: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
    handles: { initialize: 'initializeGooglePay', setPaymentIntent: 'setGooglePayPaymentIntent' },
    events: {
        authorized: 'onGooglePayAuthorized',
        failure: 'onGooglePayFailure',
        clicked: 'onGooglePayClicked',
        cancelled: 'onGooglePayCancelled',
    },
    reinitOnFailure: true,
    getNotChargeableMessage: () => c('Payments.error').t`Something went wrong. Google Pay verification failed.`,
};
