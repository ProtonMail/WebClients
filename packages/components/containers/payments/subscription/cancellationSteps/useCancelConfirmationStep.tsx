import { useSubscription } from '@proton/account/subscription/hooks';
import { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { useFlag } from '@proton/unleash/useFlag';

import { useModalTwoPromise } from '../../../../components/modalTwo/useModalTwo';
import { CancelSubscriptionModal } from '../cancelSubscription/CancelSubscriptionModal';
import { CancelSubscriptionModalForWorldCup } from '../cancelSubscription/CancelSubscriptionModalForWorldCup/CancelSubscriptionModalForWorldCup';
import type { CancelSubscriptionResult } from '../cancelSubscription/types';
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
        [COUPON_CODES.VPN_PLUS_FREE_2024, COUPON_CODES.TRYVPNPLUS2024, COUPON_CODES.VPNMATCHDAYDEALS].find(
            (coupon) => coupon === subscription?.CouponCode
        ) &&
        subscription.UpcomingSubscription?.CouponCode !== COUPON_CODES.VPNSAVEOFFER;

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
