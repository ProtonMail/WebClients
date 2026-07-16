import { useSubscription } from '@proton/account/subscription/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { useFlag } from '@proton/unleash/useFlag';

import { CancelSubscriptionModal } from '../cancelSubscription/CancelSubscriptionModal';
import type { CancelSubscriptionResult } from '../cancelSubscription/types';
import { CancelSubscriptionModalForWorldCup } from '../cancelSubscription/worldCupCancelation/CancelSubscriptionModalForWorldCup';
import type { CancellationStep, CancellationStepConfig } from './types';

function hasSubscribedDuringWorldCupRange({ CreateTime }: Subscription): boolean {
    const juneFirstSeconds = Math.floor(new Date(2026, 5, 1).getTime() / 1000);
    const julyTwentiethSeconds = Math.floor(new Date(2026, 6, 20, 23, 59, 59).getTime() / 1000);

    return CreateTime <= julyTwentiethSeconds && CreateTime >= juneFirstSeconds;
}

export const useCancelConfirmationStep = ({
    canShow,
}: CancellationStepConfig): CancellationStep<CancelSubscriptionResult> => {
    const worldCupRetentionFF = useFlag('WorldCupRetention');
    const [subscription] = useSubscription();
    const [cancelSubscriptionModal, showCancelSubscriptionModal] = useModalTwoPromise<
        undefined,
        CancelSubscriptionResult
    >();

    const displayWorldCupRetentionModal =
        worldCupRetentionFF &&
        subscription?.Cycle === CYCLE.MONTHLY &&
        hasSubscribedDuringWorldCupRange(subscription) &&
        [
            COUPON_CODES.VPN_PLUS_FREE_2024,
            COUPON_CODES.TRYVPNPLUS2024,
            COUPON_CODES.VPNMATCHDAYDEALS,
            COUPON_CODES.VPNSAVEOFFER,
        ].find((coupon) => coupon === subscription?.CouponCode);

    const modal = isPaidSubscription(subscription)
        ? cancelSubscriptionModal((props) => {
              return displayWorldCupRetentionModal ? (
                  <CancelSubscriptionModalForWorldCup subscription={subscription} {...props} />
              ) : (
                  <CancelSubscriptionModal subscription={subscription} {...props} />
              );
          })
        : null;

    const show = async () => {
        if (!(await canShow())) {
            return { status: 'kept' as const };
        }

        return showCancelSubscriptionModal();
    };

    return { modal, show };
};
