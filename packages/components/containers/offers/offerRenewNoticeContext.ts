import { createContext, useContext } from 'react';

import type { FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { PlansMap } from '@proton/shared/lib/payments/plan/interface';

export type GetOfferRenewNotice = (props: {
    checkResult: SubscriptionEstimation;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    subscription?: Subscription | FreeSubscription;
    app: APP_NAMES | undefined;
}) => string;

/**
 * Builds the renewal notice shown in the offer modal footer. The implementation lives in `@proton/payments-ui`,
 * which sits above `@proton/components`, so it is provided by `OfferRenewNoticeProvider`. Without a provider, deals
 * have no renewal notice.
 */
export const OfferRenewNoticeContext = createContext<GetOfferRenewNotice | undefined>(undefined);

export const useOfferRenewNotice = () => useContext(OfferRenewNoticeContext);
