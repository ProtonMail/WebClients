import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { InlineLinkButton } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import { getPlanIDs, getPlanTitle, isTrialExpired, willTrialExpireInLessThan1Week } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { dateLocale } from '@proton/shared/lib/i18n';

import TopBanner from '../TopBanner';

const ModalAction = ({ textAction, upsellRef }: { textAction: string; upsellRef: string | undefined }) => {
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();

    return (
        <InlineLinkButton
            className="color-inherit"
            onClick={() => {
                openSubscriptionModal({
                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                    planIDs: getPlanIDs(subscription),
                    upsellRef,
                    metrics: {
                        source: 'upsells',
                    },
                });
            }}
        >
            {textAction}
        </InlineLinkButton>
    );
};

const TrialEndsActionButton = ({
    refApp,
    app,
    textAction,
}: {
    refApp?: APP_NAMES;
    app: APP_NAMES;
    textAction: string;
}) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();

    if (subscriptionLoading) {
        return null;
    }

    const upsellRef = getUpsellRefFromApp({
        app: refApp ?? APP_NAME,
        fromApp: app,
        component: UPSELL_COMPONENT.BANNER,
        feature: SHARED_UPSELL_PATHS.TRIAL_WILL_END,
    });

    // If that's already Account or VPN settings app then we render the button that will open the subscription modal
    // directly
    if (APP_NAME === APPS.PROTONACCOUNT || APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return <ModalAction upsellRef={upsellRef} textAction={textAction} />;
    }

    // For all other apps we render the button that will redirect to the account app
    const upgradePath = addUpsellPath(getUpgradePath({ user, subscription, app: APP_NAME }), upsellRef);
    return (
        <SettingsLink path={upgradePath} className="color-inherit">
            {textAction}
        </SettingsLink>
    );
};

const TrialEndsActionButtonSwitcher = ({ app }: { app: APP_NAMES }) => {
    const [subscription] = useSubscription();

    const planTitle = getPlanTitle(subscription);
    let textAction = c('Button').t`Continue using ${planTitle}`;
    if (!planTitle) {
        textAction = c('Button').t`Continue your subscription`;
    }

    return <TrialEndsActionButton app={app} textAction={textAction} />;
};

const ReferralTopBanner = ({ app }: { app: APP_NAMES }) => {
    const [subscription, loadingSubscription] = useSubscription();

    if (loadingSubscription || !subscription) {
        return null;
    }

    const action = <TrialEndsActionButtonSwitcher key="trial-action-button" app={app} />;

    if (willTrialExpireInLessThan1Week(subscription)) {
        const textDate = format(fromUnixTime(subscription.PeriodEnd), 'PPP', { locale: dateLocale });

        return (
            <TopBanner className="bg-info">{c('Warning').jt`Your free trial ends on ${textDate}. ${action}`}</TopBanner>
        );
    }

    // Trial has ended
    const isExpired = isTrialExpired(subscription);
    if (isExpired) {
        const message = c('Message')
            .jt`Your free trial has ended. Access to your account will soon be disabled. ${action}`;
        return <TopBanner className="bg-danger">{message}</TopBanner>;
    }

    // In trial
    return null;
};

export default ReferralTopBanner;
