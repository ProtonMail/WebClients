import type { ReactNode } from 'react';

import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import type {
    COUPON_CODES,
    CYCLE,
    Currency,
    PaymentMethodStatusExtended,
    PaymentsApi,
    Plan,
    PlanIDs,
    Subscription,
} from '@proton/payments/index';
import type { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type useGetFlag from '@proton/unleash/useGetFlag';

/**
 * Upsell config passed to the subscription modal
 */
export interface UpsellModalConfig {
    cycle: CYCLE;
    couponCode?: COUPON_CODES;
    footerText: ReactNode;
    submitText: ReactNode | ((closeModal: () => void) => ReactNode);
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
    status: PaymentMethodStatusExtended;
    getFlag: ReturnType<typeof useGetFlag>;
    plans: Plan[];
    subscription: Subscription;
    user: UserModel;
    upsellRef?: string;
    currency: Currency;
}

/**
 * Values returned by every upsellConfig cases
 */
export interface UpsellModalConfigResult
    extends Pick<UpsellModalConfig, 'cycle' | 'footerText' | 'planIDs' | 'submitText'> {
    configOverride?: (config: OpenCallbackProps) => void;
    coupon?: COUPON_CODES;
}

export type UpsellModalConfigCase = (params: UpsellModalConfigParams) => Promise<UpsellModalConfigResult>;
