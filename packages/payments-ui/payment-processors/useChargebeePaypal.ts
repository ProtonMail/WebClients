import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
} from '@proton/payments/core/interface';
import type { Api } from '@proton/shared/lib/interfaces';

import { type WalletProcessorHook, useChargebeeWallet } from './useChargebeeWallet';
import { paypalWalletConfig } from './walletConfigs';

export interface ChargebeePaypalModalHandles {
    onAuthorize: () => void;
    onCancel: () => void;
    onClick: () => void;
    onFailure: (error: any) => void;
}

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
}

export interface Dependencies {
    api: Api;
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
    chargebeePaypalModalHandles: ChargebeePaypalModalHandles | undefined;
}

export type ChargebeePaypalProcessorHook = Omit<WalletProcessorHook, 'iframeLoadedRef' | 'meta'> & {
    paypalIframeLoadedRef: React.MutableRefObject<boolean>;
    meta: { type: 'chargebee-paypal' };
};

export const useChargebeePaypal = (
    props: Props,
    { api, handles, events, chargebeePaypalModalHandles }: Dependencies
): ChargebeePaypalProcessorHook => {
    const { iframeLoadedRef, ...wallet } = useChargebeeWallet(paypalWalletConfig, props, {
        api,
        handles,
        events,
        modalHandles: chargebeePaypalModalHandles,
    });

    return {
        ...wallet,
        paypalIframeLoadedRef: iframeLoadedRef,
        meta: { type: 'chargebee-paypal' },
    };
};
