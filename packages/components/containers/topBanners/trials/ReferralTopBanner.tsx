import { type ReactNode, useState } from 'react';

import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button, ButtonLike, type ButtonProps, InlineLinkButton } from '@proton/atoms';
import { FeatureCode, useFeature } from '@proton/features';
import {
    CYCLE,
    Renew,
    getPlanIDs,
    getPlanTitle,
    hasTrialExpiredLessThan4Weeks,
    isTrial,
    isTrialExpired,
    willTrialExpireInLessThan1Week,
} from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { dateLocale } from '@proton/shared/lib/i18n';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import SettingsLink from '../../../components/link/SettingsLink';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import useModalState from '../../../components/modalTwo/useModalState';
import useConfig from '../../../hooks/useConfig';
import { type SubscriptionContainerProps } from '../../payments/subscription/SubscriptionContainer';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';
import TopBanner from '../TopBanner';

interface ModalActionProps extends Pick<ButtonProps, 'color' | 'shape'> {
    upsellRef: string | undefined;
    step: SubscriptionContainerProps['step'];
    closeModal: () => void;
    disablePlanSelection: boolean;
    children: ReactNode;
}

const ModalAction = ({ upsellRef, step, closeModal, disablePlanSelection, children, ...rest }: ModalActionProps) => {
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();

    return (
        <Button
            onClick={() => {
                openSubscriptionModal({
                    step,
                    disablePlanSelection,
                    planIDs: getPlanIDs(subscription),
                    upsellRef,
                    metrics: {
                        source: 'upsells',
                    },
                    cycle: CYCLE.YEARLY,
                });
                closeModal();
            }}
            {...rest}
        >
            {children}
        </Button>
    );
};

interface ManageSubscriptionButtonProps extends Pick<ButtonProps, 'color' | 'shape'> {
    app: APP_NAMES;
    target: 'compare' | 'checkout';
    closeModal: () => void;
    children: ReactNode;
}

const ManageSubscriptionButton = ({ app, target, closeModal, children, ...rest }: ManageSubscriptionButtonProps) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const [subscription, subscriptionLoading] = useSubscription();

    if (subscriptionLoading) {
        return null;
    }

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        fromApp: app,
        component: UPSELL_COMPONENT.BANNER,
        feature: SHARED_UPSELL_PATHS.TRIAL_WILL_END,
    });

    const disablePlanSelection = target === 'checkout';

    // If that's already Account or VPN settings app then we render the button that will open the subscription modal directly
    if (APP_NAME === APPS.PROTONACCOUNT || APP_NAME === APPS.PROTONVPN_SETTINGS) {
        const step = (() => {
            if (target === 'compare') {
                return SUBSCRIPTION_STEPS.PLAN_SELECTION;
            }

            return SUBSCRIPTION_STEPS.CHECKOUT;
        })();
        return (
            <ModalAction
                upsellRef={upsellRef}
                step={step}
                closeModal={closeModal}
                disablePlanSelection={disablePlanSelection}
                {...rest}
            >
                {children}
            </ModalAction>
        );
    }

    // For all other apps we render the button that will redirect to the account app
    const upgradePath = addUpsellPath(
        getUpgradePath({ user, subscription, target, app: APP_NAME, disablePlanSelection, cycle: CYCLE.YEARLY }),
        upsellRef
    );
    return (
        <ButtonLike as={SettingsLink} {...rest} path={upgradePath} onClick={closeModal}>
            {children}
        </ButtonLike>
    );
};

const ContinueSubscriptionActionButton = ({ app }: { app: APP_NAMES }) => {
    const [subscription] = useSubscription();
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const planTitle = getPlanTitle(subscription);

    const modalTitle = (() => {
        if (!planTitle) {
            return c('Title').t`Upgrade to keep your premium benefits.`;
        }

        return c('Title').t`Upgrade to keep your ${planTitle} benefits.`;
    })();

    const ctaText = (() => {
        if (!planTitle) {
            return c('Button').t`Continue your subscription`;
        }

        return c('Button').t`Continue using ${planTitle}`;
    })();

    const closeModal = () => {
        setModalOpen(false);
    };

    return (
        <>
            {renderModal && (
                <ModalTwo {...modalProps} size="small">
                    <ModalTwoHeader title={modalTitle} />
                    <ModalTwoContent>
                        {planTitle
                            ? c('Info').t`Continue with ${planTitle} or explore other available plans.`
                            : c('Info').t`Choose a plan that works best for you.`}
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex flex-column">
                        <ManageSubscriptionButton color="norm" app={app} target="checkout" closeModal={closeModal}>
                            {planTitle ? getPlanOrAppNameText(planTitle) : c('Info').t`Continue`}
                        </ManageSubscriptionButton>
                        <ManageSubscriptionButton
                            color="norm"
                            shape="underline"
                            app={app}
                            target="compare"
                            closeModal={closeModal}
                        >
                            {c('Action').t`Explore other plans`}
                        </ManageSubscriptionButton>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
            <InlineLinkButton className="color-inherit" onClick={() => setModalOpen(true)}>
                {ctaText}
            </InlineLinkButton>
        </>
    );
};

const ReferralTopBanner = ({ app }: { app: APP_NAMES }) => {
    const [subscription, loadingSubscription] = useSubscription();

    const { feature: showReferralTrialEndedBanner, update: setShowReferralTrialEndedBanner } = useFeature(
        FeatureCode.ShowReferralTrialEndedBanner
    );
    const { feature: showReferralTrialWillEndBanner, update: setShowReferralTrialWillEndBanner } = useFeature(
        FeatureCode.ShowReferralTrialWillEndBanner
    );
    const [dismissing, setDismissing] = useState(false);

    if (loadingSubscription || !subscription) {
        return null;
    }

    if (isTrial(subscription)) {
        return null;
    }

    const continueSubscriptionAction = <ContinueSubscriptionActionButton app={app} key="trial-action-button" />;

    const isExpired = isTrialExpired(subscription);

    if (isExpired) {
        if (!showReferralTrialEndedBanner?.Value || dismissing) {
            return null;
        }

        if (!hasTrialExpiredLessThan4Weeks(subscription)) {
            // Do not show if more than 4 weeks have passed since the trial ended
            return null;
        }

        const dismiss = async () => {
            setDismissing(true);
            await setShowReferralTrialEndedBanner(false);
        };

        const message = c('Message').jt`Your free trial has ended. ${continueSubscriptionAction}`;

        return (
            <TopBanner className="bg-info" onClose={dismiss}>
                {message}
            </TopBanner>
        );
    }

    if (willTrialExpireInLessThan1Week(subscription)) {
        if (!showReferralTrialWillEndBanner?.Value || dismissing) {
            return null;
        }

        const subscriptionWillAutoRenew = subscription.Renew === Renew.Enabled;

        const dismiss = async () => {
            setDismissing(true);
            await setShowReferralTrialWillEndBanner(false);
        };

        const textDate = format(fromUnixTime(subscription.PeriodEnd), 'PPP', { locale: dateLocale });

        return (
            <TopBanner className="bg-info" onClose={dismiss}>
                {subscriptionWillAutoRenew
                    ? c('Warning')
                          .jt`Your trial will end on ${textDate}. You won’t be charged if you cancel before ${textDate}.`
                    : c('Warning').jt`Your free trial ends on ${textDate}. ${continueSubscriptionAction}`}
            </TopBanner>
        );
    }

    return null;
};

export default ReferralTopBanner;
