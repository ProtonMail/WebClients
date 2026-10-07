import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
} from '@proton/payments/core/interface';
import type { Api } from '@proton/shared/lib/interfaces';

import { type WalletProcessorHook, useChargebeeWallet } from './useChargebeeWallet';
import { applePayWalletConfig } from './walletConfigs';

export type ApplePayModalHandles = {
    onAuthorize: () => void;
    onClick: () => void;
    onFailure: (error: any) => void;
    onCancel: () => void;
    onMountFailure: () => void;
};

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
}

export interface Dependencies {
    api: Api;
    events: ChargebeeIframeEvents;
    handles: ChargebeeIframeHandles;
    applePayModalHandles: ApplePayModalHandles | undefined;
}

export type ApplePayProcessorHook = Omit<WalletProcessorHook, 'iframeLoadedRef' | 'meta'> & {
    applePayIframeLoadedRef: React.MutableRefObject<boolean>;
    meta: { type: PAYMENT_METHOD_TYPES.APPLE_PAY };
};

export const useApplePay = (
    props: Props,
    { api, handles, events, applePayModalHandles }: Dependencies
): ApplePayProcessorHook => {
    const { iframeLoadedRef, ...wallet } = useChargebeeWallet(applePayWalletConfig, props, {
        api,
        handles,
        events,
        modalHandles: applePayModalHandles,
    });

    return {
        ...wallet,
        applePayIframeLoadedRef: iframeLoadedRef,
        meta: { type: applePayWalletConfig.type as PAYMENT_METHOD_TYPES.APPLE_PAY },
    };
};
