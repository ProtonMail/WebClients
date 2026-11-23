import { PLANS } from '@proton/payments/core/constants';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import { isUnavailableNextToSubscriptions } from './helper';
import { type PlanCard, type SignupConfiguration, isRegularPlanCard } from './interface';

type PlanCards = SignupConfiguration['planCards'];

const isOfferedPlanCard = (multiSubscriptionContext: MultiSubscriptionContext) => (planCard: PlanCard) =>
    !isRegularPlanCard(planCard) ||
    planCard.plan === PLANS.FREE ||
    !isUnavailableNextToSubscriptions(multiSubscriptionContext, { ...planCard.addons, [planCard.plan]: 1 });

const hasRegularPlanCardFor = (planCards: PlanCards, audience: Audience) =>
    (audience === Audience.B2B || audience === Audience.B2C) && planCards[audience].some(isRegularPlanCard);

export const getOfferedSignupConfiguration = (
    signupConfiguration: SignupConfiguration,
    multiSubscriptionContext: MultiSubscriptionContext | undefined
): SignupConfiguration => {
    if (!multiSubscriptionContext) {
        return signupConfiguration;
    }

    const { planCards, audience, audiences } = signupConfiguration;
    const offeredPlanCards: PlanCards = {
        [Audience.B2C]: planCards[Audience.B2C].filter(isOfferedPlanCard(multiSubscriptionContext)),
        [Audience.B2B]: planCards[Audience.B2B].filter(isOfferedPlanCard(multiSubscriptionContext)),
    };
    const isOfferedAudience = ({ value }: { value: Audience }) =>
        value === audience ||
        !hasRegularPlanCardFor(planCards, value) ||
        hasRegularPlanCardFor(offeredPlanCards, value);

    return {
        ...signupConfiguration,
        planCards: offeredPlanCards,
        audiences: audiences?.filter(isOfferedAudience),
    };
};
