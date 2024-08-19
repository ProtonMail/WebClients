import { c } from 'ttag';

import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components/containers';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useConfig, useSubscription, useUser } from '@proton/components/hooks';
import { APPS, COUPON_CODES, CYCLE, UPSELL_ONE_DOLLAR_PROMO_PATHS } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { formatURLForAjaxRequest } from '@proton/shared/lib/helpers/url';
import type { Currency } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import getUpsellSubscriptionModalConfig from './getUpsellSubscriptionModalConfig';
import { type UpsellModalProps } from './modal/UpsellModal';

interface Props {
    upsellRef?: string;
    step?: SUBSCRIPTION_STEPS;
    onSubscribed?: () => void;
}

// Return config properties to inject in the subscription modal
const useUpsellConfig = ({ upsellRef, step, onSubscribed }: Props): Partial<UpsellModalProps> => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const hasSubscriptionModal = openSubscriptionModal !== noop;
    const inboxUpsellFlowEnabled = useFlag('InboxUpsellFlow');
    const ABTestInboxUpsellOneDollarEnabled = useFlag('ABTestInboxUpsellOneDollar');
    const { APP_NAME } = useConfig();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const hasInAppPayments = APP_NAME === APPS.PROTONMAIL || hasInboxDesktopInAppPayments;

    if (hasSubscriptionModal && hasInAppPayments && inboxUpsellFlowEnabled && upsellRef) {
        const currency: Currency = user?.Currency || 'USD';
        const isOneDollarPromo =
            ABTestInboxUpsellOneDollarEnabled &&
            UPSELL_ONE_DOLLAR_PROMO_PATHS.some((promoPath) => upsellRef?.includes(promoPath));

        const subscriptionCallBackProps = getUpsellSubscriptionModalConfig({
            coupon: isOneDollarPromo ? COUPON_CODES.TRYMAILPLUS0724 : undefined,
            cycle: isOneDollarPromo ? CYCLE.MONTHLY : undefined,
            step: isOneDollarPromo ? SUBSCRIPTION_STEPS.CHECKOUT : step,
            upsellRef,
        });

        const titleByCurrency = (() => {
            switch (currency) {
                case 'USD':
                    return c('new_plans: Title').t`Get Mail Plus for $1`;
                case 'EUR':
                    return c('new_plans: Title').t`Get Mail Plus for 1 €`;
                case 'CHF':
                    return c('new_plans: Title').t`Get Mail Plus for CHF 1`;
                default:
                    return c('new_plans: Title').t`Get Mail Plus`;
            }
        })();

        const messageByCurrency = (() => {
            switch (currency) {
                case 'USD':
                    return c('new_plans: Action').t`Get started for $1`;
                case 'EUR':
                    return c('new_plans: Action').t`Get started for 1 €`;
                case 'CHF':
                    return c('new_plans: Action').t`Get started for CHF 1`;
                default:
                    return c('new_plans: Action').t`Upgrade now`;
            }
        })();

        // The subscription modal will open in inbox app
        return {
            upgradePath: '',
            title: isOneDollarPromo ? titleByCurrency : undefined,
            submitText: isOneDollarPromo ? messageByCurrency : undefined,
            onUpgrade() {
                // Generate a mocked request to track upsell activity
                const urlParameters = { ref: upsellRef, load: 'modalOpen' };
                const url = formatURLForAjaxRequest(window.location.href, urlParameters);
                fetch(url).catch(noop);

                // Open the subscription modal
                openSubscriptionModal({
                    ...subscriptionCallBackProps,
                    onSubscribed,
                });
            },
        };
    }

    // The user will be redirected to account app
    return {
        upgradePath: addUpsellPath(getUpgradePath({ user, subscription, app: APP_NAME }), upsellRef),
    };
};

export default useUpsellConfig;
