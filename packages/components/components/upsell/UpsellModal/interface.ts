import type { ReactNode } from 'react';

import type { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';
import type { Currency, FreeSubscription, PaymentsApi, PlanIDs } from '@proton/payments/core/interface';
import type { Plan } from '@proton/payments/core/plan/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type { useGetFlag } from '@proton/unleash/useGetFlag';

import type { OpenCallbackProps } from '../../../containers/payments/subscription/SubscriptionModalProvider';

/**
 * Upsell config passed to the subscription modal
 */
export interface UpsellModalConfig {
    cycle: CYCLE;
    couponCode?: COUPON_CODES;
    footerText: ReactNode;
    submitText: ReactNode | ((closeModal: () => void) => ReactNode);
    /** Formatted offer price (e.g. for use in description text) */
    offerPrice?: ReactNode;
    planIDs: PlanIDs;
    upgradePath: string;
    onUpgrade?: () => void;
}

/**
 * Parameters received by every upsell config cases
 */
export interface UpsellModalConfigParams {
    dispatch: ReturnType<typeof useDispatch>;
    paymentsApi: PaymentsApi;
    getFlag: ReturnType<typeof useGetFlag>;
    plans: Plan[];
    subscription: Subscription | FreeSubscription;
    user: UserModel;
    upsellRef?: string;
    currency: Currency;
    hasHadSubscription: boolean;
}

/**
 * Values returned by every upsellConfig cases
 */
export interface UpsellModalConfigResult extends Pick<
    UpsellModalConfig,
    'cycle' | 'footerText' | 'offerPrice' | 'planIDs' | 'submitText'
> {
    configOverride?: (config: OpenCallbackProps) => void;
    coupon?: COUPON_CODES;
}

export type UpsellModalConfigCase = (params: UpsellModalConfigParams) => Promise<UpsellModalConfigResult>;
