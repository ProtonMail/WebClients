import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import SubscriptionModalProvider, {
    useSubscriptionModal,
} from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    CYCLE,
    MAIL_APP_NAME,
    OPEN_OFFER_MODAL_EVENT,
    PLANS,
    PLAN_NAMES,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import {
    getPlanIDs,
    getPlanTitle,
    isTrial,
    isTrialExpired,
    willTrialExpire,
} from '@proton/shared/lib/helpers/subscription';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { dateLocale } from '@proton/shared/lib/i18n';

import { useConfig, useSubscription, useUser } from '../../hooks';
import TopBanner from './TopBanner';

const ModalAction = ({ textAction, upsellRef }: { textAction: string; upsellRef: string | undefined }) => {
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();

    return (
        <InlineLinkButton
            className="color-inherit"
            onClick={() => {
                openSubscriptionModal({
                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                    cycle: CYCLE.YEARLY,
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

const WrappedModalAction = ({
    fromApp,
    ...rest
}: {
    fromApp: APP_NAMES;
    textAction: string;
    upsellRef: string | undefined;
}) => {
    return (
        <SubscriptionModalProvider app={fromApp}>
            <ModalAction {...rest} />
        </SubscriptionModalProvider>
    );
};

const TrialEndsActionButton = ({
    refApp,
    fromApp,
    textAction,
}: {
    refApp?: APP_NAMES;
    fromApp: APP_NAMES;
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
        fromApp,
        component: UPSELL_COMPONENT.BANNER,
        feature: SHARED_UPSELL_PATHS.TRIAL_WILL_END,
    });

    // If that's already Account or VPN settings app then we render the buton that will open the subscription modal
    // directly
    if (APP_NAME === APPS.PROTONACCOUNT || APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return <WrappedModalAction upsellRef={upsellRef} fromApp={fromApp} textAction={textAction} />;
    }

    // For all other apps we render the button that will redirect to the account app
    const upgradePath = addUpsellPath(getUpgradePath({ user, subscription, app: APP_NAME }), upsellRef);
    return (
        <SettingsLink path={upgradePath} className="color-inherit">
            {textAction}
        </SettingsLink>
    );
};

/**
 * Mail and account apps have an upsell modal. It's triggered by the `OPEN_OFFER_MODAL_EVENT` event.
 * The handler component must be rendered in DOM to handle the events.
 */
const UpgradeBannerLink = ({ textAction }: { textAction: string }) => {
    const handleClick = () => document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));

    return (
        <InlineLinkButton key="continue" className="color-inherit" onClick={handleClick}>
            {textAction}
        </InlineLinkButton>
    );
};

const TrialEndsActionButtonSwitcher = ({ fromApp }: { fromApp: APP_NAMES }) => {
    const [subscription] = useSubscription();

    if (isTrial(subscription, PLANS.MAIL)) {
        const textAction = c('Button').t`Continue using ${MAIL_APP_NAME}.`;
        return <UpgradeBannerLink textAction={textAction} />;
    }

    if (isTrial(subscription, PLANS.BUNDLE)) {
        const planTitle = PLAN_NAMES[PLANS.BUNDLE];
        const textAction = c('Button').t`Continue using ${planTitle}`;
        return <TrialEndsActionButton fromApp={fromApp} textAction={textAction} />;
    }

    // a catch-all for all other cases
    if (subscription && isTrial(subscription)) {
        const planTitle = getPlanTitle(subscription);
        let textAction = c('Button').t`Continue using ${planTitle}`;
        if (!planTitle) {
            textAction = c('Button').t`Continue your subscription`;
        }

        return <TrialEndsActionButton fromApp={fromApp} textAction={textAction} />;
    }

    return null;
};

const ReferralTopBanner = ({ fromApp }: { fromApp: APP_NAMES }) => {
    const [subscription, loadingSubscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const isVpn = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const trial = isTrial(subscription);
    if (loadingSubscription || !trial || isVpn) {
        return null;
    }

    const action = <TrialEndsActionButtonSwitcher key="trial-action-button" fromApp={fromApp} />;
    const { PeriodEnd = 0 } = subscription || {};
    const textDate = format(fromUnixTime(PeriodEnd), 'PPP', { locale: dateLocale });

    // 1 week before the trial ends
    const willExpire = willTrialExpire(subscription);
    if (willExpire) {
        const message = c('Warning').jt`Your free trial ends on ${textDate}. ${action}`;
        return <TopBanner className="bg-warning">{message}</TopBanner>;
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
