import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentVerificatorV5 } from '@proton/payments/core/createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
} from '@proton/payments/core/interface';
import type { Api } from '@proton/shared/lib/interfaces';

import { type WalletProcessorHook, useChargebeeWallet } from './useChargebeeWallet';
import { googlePayWalletConfig } from './walletConfigs';

export type GooglePayModalHandles = {
    onAuthorize: () => void;
    onClick: () => void;
    onFailure: (error: any) => void;
    onCancel: () => void;
    on3DSChallenge: () => void;
    onInitialize: () => void;
};

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
}

export interface Dependencies {
    api: Api;
    events: ChargebeeIframeEvents;
    handles: ChargebeeIframeHandles;
    googlePayModalHandles: GooglePayModalHandles | undefined;
    verifyPayment: PaymentVerificatorV5;
}

export type GooglePayProcessorHook = Omit<WalletProcessorHook, 'iframeLoadedRef' | 'meta'> & {
    googlePayIframeLoadedRef: React.MutableRefObject<boolean>;
    meta: { type: PAYMENT_METHOD_TYPES.GOOGLE_PAY };
};

export const useGooglePay = (
    props: Props,
    { api, handles, events, googlePayModalHandles, verifyPayment }: Dependencies
): GooglePayProcessorHook => {
    const { iframeLoadedRef, ...wallet } = useChargebeeWallet(googlePayWalletConfig, props, {
        api,
        handles,
        events,
        modalHandles: googlePayModalHandles,
        verifyPayment,
    });

    return {
        ...wallet,
        googlePayIframeLoadedRef: iframeLoadedRef,
        meta: { type: googlePayWalletConfig.type as PAYMENT_METHOD_TYPES.GOOGLE_PAY },
    };
};
