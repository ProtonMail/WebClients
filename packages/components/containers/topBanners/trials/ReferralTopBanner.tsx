import { type ReactNode, useState } from 'react';

import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button, ButtonLike, type ButtonProps, InlineLinkButton } from '@proton/atoms';
import Logo from '@proton/components/components/logo/Logo';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { FeatureCode, useFeature } from '@proton/features';
import { IcCheckmark } from '@proton/icons';
import {
    CYCLE,
    FREE_PLAN,
    PLANS,
    Renew,
    getPlan,
    getPlanIDs,
    getPlanName,
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
import { getDocumentEditor, getStorageFeature, getVersionHistory } from '../../payments/features/drive';
import { getNAddressesFeature, getNDomainsFeature } from '../../payments/features/mail';
import {
    get2FAAuthenticator,
    getDarkWebMonitoring,
    getHideMyEmailAliases,
    getSecureVaultSharing,
} from '../../payments/features/pass';
import type { SubscriptionContainerProps } from '../../payments/subscription/SubscriptionContainer';
import { useSubscriptionModal } from '../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../payments/subscription/constants';
import type { UpsellFeature } from '../../payments/subscription/helpers/dashboard-upsells';
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

const getAppFromPlan = (plan: PLANS | undefined) => {
    if (plan === PLANS.MAIL) {
        return APPS.PROTONMAIL;
    } else if (plan === PLANS.DRIVE) {
        return APPS.PROTONDRIVE;
    } else if (plan === PLANS.PASS) {
        return APPS.PROTONPASS;
    }
    return null;
};

const ContinueSubscriptionActionButton = ({ app }: { app: APP_NAMES }) => {
    const [subscription] = useSubscription();
    const [modalProps, setModalOpen, renderModal] = useModalState();
    const [referralInfo] = useReferralInfo();

    const [plansResult] = usePlans();
    const freePlan = plansResult?.freePlan || FREE_PLAN;

    const planTitle = getPlanTitle(subscription);
    const planName = getPlanName(subscription);
    const appName = getAppFromPlan(planName);

    const appLogo = (() => {
        if (!appName) {
            return null;
        }

        return (
            <span className="flex justify-center">
                <Logo appName={appName} variant="glyph-only" size={12} />
            </span>
        );
    })();

    const modalTitle = (() => {
        if (!planTitle) {
            return c('Title').t`Upgrade to keep your premium benefits.`;
        }

        return getBoldFormattedText(
            c('Title').t`Get **${referralInfo.uiData.refereeRewardAmount}** in credits with ${planTitle}`,
            'color-primary'
        );
    })();

    const featuresList = (() => {
        const plan = getPlan(subscription);

        if (!appName || !plan) {
            return null;
        }

        const getMorePremiumFeatures = () => {
            return {
                text: c('Feature').t`More premium features`,
            };
        };

        const MailFeatures: UpsellFeature[] = [
            getStorageFeature(plan?.MaxSpace ?? 16106127360, { freePlan }),
            getNAddressesFeature({ n: 10 }),
            getNDomainsFeature({ n: 1 }),
            getDarkWebMonitoring(),
            getMorePremiumFeatures(),
        ];

        const DriveFeatures: UpsellFeature[] = [
            getStorageFeature(plan?.MaxSpace ?? 214748364800, { freePlan }),
            {
                text: c('Feature').t`Encrypted cloud storage for files, photos and documents`,
            },
            getDocumentEditor(),
            getVersionHistory(),
        ];

        const PassFeatures: UpsellFeature[] = [
            getHideMyEmailAliases('unlimited'),
            get2FAAuthenticator(true),
            getSecureVaultSharing(true),
            getDarkWebMonitoring(),
            getMorePremiumFeatures(),
        ];

        const features = (() => {
            if (plan.Name === PLANS.MAIL) {
                return MailFeatures;
            }
            if (plan.Name === PLANS.DRIVE) {
                return DriveFeatures;
            }
            if (plan.Name === PLANS.PASS) {
                return PassFeatures;
            }
            return [];
        })();

        if (features.length === 0) {
            return null;
        }

        return (
            <StripedList alternate="odd">
                {features.map(({ icon, text }) => {
                    const key = typeof text === 'string' ? text : `${icon}-${text}`;

                    return (
                        <StripedItem key={key} left={<IcCheckmark className="color-primary" size={5} />}>
                            {text}
                        </StripedItem>
                    );
                })}
            </StripedList>
        );
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
                    <ModalTwoHeader />
                    <ModalTwoContent>
                        <div className="text-center">
                            {appLogo}
                            <h1 className="text-xl mb-2 mt-0 text-bold px-16">{modalTitle}</h1>
                            {planTitle
                                ? c('Info').t`Upgrade to keep your ${planTitle} benefits.`
                                : c('Info').t`Choose a plan that works best for you.`}
                        </div>
                        {featuresList}
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
