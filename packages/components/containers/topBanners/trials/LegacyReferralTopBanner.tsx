import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import {
    getPlanIDs,
    getPlanTitle,
    isTrial,
    isTrialExpired,
    willTrialExpireInLessThan1Week,
} from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { getUpgradePath } from '@proton/payments/core/subscription/upsell';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    MAIL_APP_NAME,
    OPEN_OFFER_MODAL_EVENT,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/ref';
import { dateLocale } from '@proton/shared/lib/i18n';

import SettingsLink from '../../../components/link/SettingsLink';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import TopBanner from '../TopBanner';

const ModalAction = ({
    subscription,
    textAction,
    upsellRef,
}: {
    subscription: Subscription;
    textAction: string;
    upsellRef: string | undefined;
}) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    return (
        <InlineLinkButton
            className="color-inherit"
            disabled={loadingSubscriptionModal}
            onClick={() => {
                void openSubscriptionModal({
                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                    cycle: CYCLE.YEARLY,
                    planIDs: getPlanIDs(subscription),
                    upsellRef,
                });
            }}
        >
            {textAction}
        </InlineLinkButton>
    );
};

const TrialEndsActionButton = ({
    subscription,
    refApp,
    fromApp,
    textAction,
}: {
    subscription: Subscription;
    refApp?: APP_NAMES;
    fromApp: APP_NAMES;
    textAction: string;
}) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();

    const upsellRef = getUpsellRefFromApp({
        app: refApp ?? APP_NAME,
        fromApp,
        component: UPSELL_COMPONENT.BANNER,
        feature: SHARED_UPSELL_PATHS.TRIAL_WILL_END,
    });
    // If that's already Account or VPN settings app then we render the button that will open the subscription modal
    // directly
    if (APP_NAME === APPS.PROTONACCOUNT || APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return <ModalAction subscription={subscription} upsellRef={upsellRef} textAction={textAction} />;
    }

    // For all other apps we render the button that will redirect to the account app
    const upgradePath = getUpgradePath({ user, subscription, app: APP_NAME }, upsellRef);
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

const TrialEndsActionButtonSwitcher = ({
    fromApp,
    subscription,
}: {
    fromApp: APP_NAMES;
    subscription: Subscription;
}) => {
    if (isTrial(subscription, PLANS.MAIL)) {
        const textAction = c('Button').t`Continue using ${MAIL_APP_NAME}.`;
        return <UpgradeBannerLink textAction={textAction} />;
    }

    if (isTrial(subscription, PLANS.BUNDLE)) {
        const planTitle = PLAN_NAMES[PLANS.BUNDLE];
        const textAction = c('Button').t`Continue using ${planTitle}`;
        return <TrialEndsActionButton subscription={subscription} fromApp={fromApp} textAction={textAction} />;
    }

    // a catch-all for all other cases
    if (isTrial(subscription)) {
        const planTitle = getPlanTitle(subscription);
        let textAction = c('Button').t`Continue using ${planTitle}`;
        if (!planTitle) {
            textAction = c('Button').t`Continue your subscription`;
        }

        return <TrialEndsActionButton subscription={subscription} fromApp={fromApp} textAction={textAction} />;
    }

    return null;
};

const LegacyReferralTopBanner = ({ fromApp, subscription }: { fromApp: APP_NAMES; subscription: Subscription }) => {
    const action = (
        <TrialEndsActionButtonSwitcher key="trial-action-button" fromApp={fromApp} subscription={subscription} />
    );
    const textDate = format(fromUnixTime(subscription.PeriodEnd), 'PPP', { locale: dateLocale });

    // 1 week before the trial ends
    const willExpire = willTrialExpireInLessThan1Week(subscription);
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

export default LegacyReferralTopBanner;
