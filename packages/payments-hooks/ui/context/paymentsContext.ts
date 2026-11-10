import { createContext, useContext } from 'react';

import type {
    BillingAddressExtended,
    FullBillingAddressFlat,
} from '@proton/payments/core/billing-address/billing-address';
import type { PaymentsCheckoutUI, getOptimisticCheckResult } from '@proton/payments/core/checkout';
import type { PLANS } from '@proton/payments/core/constants';
import type { getAvailableCurrencies, getPreferredCurrency } from '@proton/payments/core/currencies';
import type {
    Currency,
    Cycle,
    FreeSubscription,
    PaymentMethodFlow,
    PaymentStatus,
    PaymentsApi,
    PlanIDs,
} from '@proton/payments/core/interface';
import type { FullPlansMap, Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import type { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { FreePlanDefault, Plan, PlansMap } from '@proton/shared/lib/payments/plan/interface';

import type { OnChargeable } from '../../react-extensions/usePaymentFacade';
import type { CouponConfigRendered } from '../coupon-config/interface';
import type { MultiCheckGroupsResult } from './useMultiCheckGroups';

export interface InitializeProps {
    api: Api;
    paramCurrency?: Currency;
    paymentFlow: PaymentMethodFlow;
    planToCheck?: Omit<PlanToCheck, 'currency'>;
    onChargeable: OnChargeable;
    availablePlans?: { planIDs: PlanIDs; cycle: Cycle }[];
    telemetryContext: PaymentTelemetryContext;
    product: ProductParam;
}

export interface PricesResult {
    checkResult: SubscriptionEstimation;
    checkoutUi: PaymentsCheckoutUI;
}

export type IsTrialResolver = (planIDs: PlanIDs) => boolean;

export interface PaymentsContextType {
    createSubscription: () => Promise<void>;
    initialize: (props: InitializeProps) => Promise<void>;
    initialized: boolean;
    selectPlanIDs: (planIDs: PlanIDs) => Promise<void>;
    selectCycle: (cycle: Cycle) => Promise<void>;
    selectCurrency: (currency: Currency) => Promise<void>;
    selectFullBillingAddress: (fullBillingAddress: FullBillingAddressFlat) => Promise<void>;
    checkMultiplePlans: (planToCheck: PlanToCheck[]) => Promise<SubscriptionEstimation[]>;
    /**
     * Returns the cached version of the subscription response. Returns null if the cache is missing.
     * Make sure to call `checkMultiplePlans` first.
     */
    getPrice: (planToCheck: PlanToCheck) => PricesResult | null;
    getFallbackPrice: (planToCheck: PlanToCheck) => PricesResult;
    /**
     * Same as `getPrice`, but returns the fallback version of the price if cache is missing.
     */
    getPriceOrFallback: (planToCheck: PlanToCheck) => PricesResult;
    /**
     * Get a valid coupon by checking it against the cached multi check results
     */
    getCoupon: (planToCheck: PlanToCheck) => string | undefined;
    plans: Plan[];
    plansMap: PlansMap;

    // TODO: exposing for now. Will likely want to abstract this result
    checkResult: SubscriptionEstimation;

    /** User's intention to start a trial */
    isTrial: boolean;
    /**
     * Registers the flow's own trial resolver, overriding the `planToCheck.trial` based default.
     */
    setIsTrialResolver: (resolver: IsTrialResolver | undefined) => void;

    // paymentFacade: ReturnType<typeof usePaymentFacade>;

    billingAddress: BillingAddressExtended;
    checkoutUi: PaymentsCheckoutUI;
    paymentStatus: PaymentStatus | undefined;
    paymentsApi: PaymentsApi;
    isGroupLoading: MultiCheckGroupsResult['isGroupLoading'];
    isGroupChecked: MultiCheckGroupsResult['isGroupChecked'];
    subscription: Subscription | FreeSubscription | undefined;

    freePlan: FreePlanDefault;
    selectNewPlan: (newPlanToCheck: PlanToCheck) => Promise<SubscriptionEstimation>;
    selectedPlan: SelectedPlan;
    getOptimisticCheckResult: (planToCheck: PlanToCheck) => ReturnType<typeof getOptimisticCheckResult>;
    availableCurrencies: readonly Currency[];
    /**
     * Returns available currencies for the given plan
     */
    getAvailableCurrencies: (selectedPlanName: PLANS) => ReturnType<typeof getAvailableCurrencies>;
    getPreferredCurrency: (selectedPlanName: PLANS) => ReturnType<typeof getPreferredCurrency>;

    setVatNumber: (vatNumber: string) => Promise<void>;
    vatNumber: string | undefined;

    telemetryContext: PaymentTelemetryContext;
    loading: boolean;

    reRunPaymentChecks: () => Promise<SubscriptionEstimation | void>;
    getShouldPassTrial: (planIds: PlanIDs, cycle: Cycle, canDowngrade: boolean) => boolean;
    coupon: string | undefined;
    selectCoupon: (coupon: string) => Promise<void>;
    couponConfig: CouponConfigRendered | undefined;
    multiSubscriptionContext: MultiSubscriptionContext;
}

/** Provided by `PaymentsContextProvider` from `@proton/payments-ui`. */
export const PaymentsContext = createContext<PaymentsContextType | null>(null);

export const usePayments = (): PaymentsContextType => {
    const state = useContext(PaymentsContext);

    if (!state) {
        throw new Error('Expected to be within PaymentsContextProvider');
    }

    return state;
};

export type PreloadedPaymentsContextType = Omit<PaymentsContextType, 'paymentStatus'> & {
    paymentStatus: PaymentStatus;
    plansMap: FullPlansMap;
    subscription: Subscription | FreeSubscription;
};

export function isPaymentsPreloaded(payments: PaymentsContextType): payments is PreloadedPaymentsContextType {
    return payments.initialized;
}

export const usePaymentsPreloaded = (): PreloadedPaymentsContextType => {
    const payments = usePayments();
    if (!payments.initialized) {
        // eslint-disable-next-line no-console
        console.warn(
            'Payments context did not preload the essential data. Either call payments.initialize() first or use usePayments() instead of usePaymentsPreloaded().'
        );
    }

    return payments as PreloadedPaymentsContextType;
};
