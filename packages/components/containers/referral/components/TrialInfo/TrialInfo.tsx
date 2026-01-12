import { format, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { REACTIVATE_SOURCE } from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationTelemetry';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getReactivateSubscriptionAction } from '@proton/components/containers/payments/subscription/helpers/subscriptionExpires';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { SettingsLink, useConfig } from '@proton/components/index';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { PLANS, PLAN_NAMES, getPlanTitle, isAutoRenewTrial } from '@proton/payments';
import { isTrialRenewing } from '@proton/payments/core/subscription/helpers';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getDifferenceInDays } from '@proton/shared/lib/date/date';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { dateLocale } from '@proton/shared/lib/i18n';

import credits from './credits.svg';
import downgrade from './downgrade.svg';
import reactivate from './reactivate.svg';

const TrialInfoHeader = () => {
    return c('Title').t`How your free trial works`;
};

const TrialInfoContent = () => {
    const [subscription] = useSubscription();
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;

    const { PeriodEnd = 0 } = subscription || {};
    const textDate = format(fromUnixTime(PeriodEnd), 'PPP', { locale: dateLocale });
    const daysRemaining = getDifferenceInDays(new Date(), new Date(PeriodEnd * 1000));
    const planTitle = getPlanTitle(subscription) || c('Referral').t`your subscription`;

    return (
        <>
            {/* translator: full sentence is: Enjoy your subscription for free until Mmm DD, YYYY. */}
            <p className="mb-4">
                {getBoldFormattedText(c('Referral').t`Enjoy **${planTitle}** for free until **${textDate}**.`)}
            </p>

            {!isAutoRenewTrial(subscription) ? (
                <div className="grid grid-cols-2 gap-2">
                    <div
                        className="rounded border p-4"
                        style={{
                            borderColor: '#00BB981A',
                            background: 'linear-gradient(268.44deg, #FAFFFC -1.65%, #EBFFF8 100%)',
                        }}
                    >
                        <img src={credits} alt="" className="mb-2" />
                        <p className="m-0">
                            {getBoldFormattedText(
                                c('Referral')
                                    .t`**If you subscribe before this date,** you'll get **${referrerRewardAmount}** in credits.`
                            )}
                        </p>
                    </div>
                    <div
                        className="rounded border p-4"
                        style={{
                            borderColor: '#2800CE0D',
                            background: 'linear-gradient(268.44deg, #FBFAFF -1.65%, #F3F0FF 100%)',
                        }}
                    >
                        <img src={downgrade} alt="" className="mb-2" />
                        <p className="m-0">
                            {getBoldFormattedText(
                                c('Referral')
                                    .t`**If you don't subscribe,** you'll be **downgraded** to ${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]}.`
                            )}
                        </p>
                    </div>
                </div>
            ) : null}
            {isAutoRenewTrial(subscription) && isTrialRenewing(subscription) ? (
                <div className="grid grid-cols-2 gap-2">
                    <div
                        className="rounded border p-4"
                        style={{
                            borderColor: '#2800CE0D',
                            background: 'linear-gradient(268.44deg, #FBFAFF -1.65%, #F3F0FF 100%)',
                        }}
                    >
                        <img src={downgrade} alt="" className="mb-2" />
                        <p className="m-0">
                            {getBoldFormattedText(
                                c('Referral')
                                    .t`**If you cancel before this date,** you will be **downgraded** to ${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]} when the trial ends.`
                            )}
                        </p>
                    </div>
                    <div
                        className="rounded border p-4"
                        style={{
                            borderColor: '#00BB981A',
                            background: 'linear-gradient(268.44deg, #FAFFFC -1.65%, #EBFFF8 100%)',
                        }}
                    >
                        <img src={credits} alt="" className="mb-2" />
                        <p className="m-0">
                            {getBoldFormattedText(
                                c('Referral')
                                    .t`**If you don’t cancel,** your full plan will start and you’ll get **${referrerRewardAmount}** in credits.`
                            )}
                        </p>
                    </div>
                </div>
            ) : null}

            {isAutoRenewTrial(subscription) && !isTrialRenewing(subscription) ? (
                <div className="flex flex-column w-full items-center justify-center">
                    <img src={reactivate} alt="" className="mb-2" width={264} height={148} />
                    <p className="m-0">
                        {getBoldFormattedText(
                            c('Referral')
                                .t`After that date, your account will be downgraded to **${BRAND_NAME} Free**. If you change your mind, you can **reactivate your subscription** to keep access to premium features.`
                        )}
                    </p>
                </div>
            ) : null}

            <p className="my-4">
                {!isAutoRenewTrial(subscription) &&
                    (daysRemaining > 0
                        ? getBoldFormattedText(
                              c('Referral').ngettext(
                                  msgid`You have **${daysRemaining} day left** to explore all the powerful features that **${planTitle}** has to offer.`,
                                  `You have **${daysRemaining} days left** to explore all the powerful features that **${planTitle}** has to offer.`,
                                  daysRemaining
                              )
                          )
                        : getBoldFormattedText(
                              c('Referral')
                                  .t`Last chance to explore all the powerful features that **${planTitle}** has to offer.`
                          ))}
                {isAutoRenewTrial(subscription) && isTrialRenewing(subscription)
                    ? c('Referral')
                          .t`Once your full subscription starts, you can still cancel within 30 days and get a prorated refund.`
                    : null}
            </p>
        </>
    );
};

interface TrialInfoFooterProps {
    modalProps?: Partial<ModalStateProps>;
}

const TrialInfoFooter = ({ modalProps }: TrialInfoFooterProps) => {
    const [subscription, loadingSubscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const { onClose } = modalProps || {};
    const telemetryFlow = useDashboardPaymentFlow(APP_NAME);
    const [openSubscriptionModal] = useSubscriptionModal();
    const goToSettings = useSettingsLink();

    const handleExplorePlans = () => {
        if (onClose) {
            onClose();
        }
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'plans' },
            telemetryFlow,
        });
    };

    const handleCancelSubscription = () => {
        if (onClose) {
            onClose();
        }
        goToSettings('/dashboard#cancel-subscription');
    };

    if (loadingSubscription) {
        return <Loader />;
    }

    const Action = () => {
        if (!subscription) {
            return null;
        }

        const reactivateLinkData = getReactivateSubscriptionAction(subscription, REACTIVATE_SOURCE.trial);

        const reactivateLink =
            reactivateLinkData.type === 'internal' ? (
                <ButtonLike
                    onClick={onClose}
                    as={SettingsLink}
                    data-testid="reactivate-link"
                    key="reactivate-subscription-internal"
                    path={reactivateLinkData.path}
                    color="norm"
                    fullWidth
                >{c('Link').t`Reactivate subscription`}</ButtonLike>
            ) : (
                <ButtonLike
                    as={Href}
                    data-testid="reactivate-link"
                    key="reactivate-subscription-external"
                    href={reactivateLinkData.href}
                    fullWidth
                    color="norm"
                >{c('Link').t`Reactivate subscription`}</ButtonLike>
            );

        if (isAutoRenewTrial(subscription) && isTrialRenewing(subscription)) {
            return (
                <Button
                    onClick={handleCancelSubscription}
                    size="large"
                    color="weak"
                    shape="outline"
                    fullWidth
                    data-testid="trial-info-cancel-subscription"
                >
                    {c('Action').t`Cancel subscription`}
                </Button>
            );
        }
        if (isAutoRenewTrial(subscription) && !isTrialRenewing(subscription)) {
            return reactivateLink;
        }

        return (
            <Button
                onClick={handleExplorePlans}
                size="large"
                color="norm"
                fullWidth
                data-testid="trial-info-subscribe-now"
            >
                {c('Action').t`Subscribe now`}
            </Button>
        );
    };

    return (
        <>
            <Action />

            <ButtonLike
                as="a"
                href={getKnowledgeBaseUrl('/referral-program')}
                target="_blank"
                shape="underline"
                color="norm"
                size="large"
                data-testid="trial-info-learn-more"
                className="inline-flex gap-2 items-center justify-center w-full"
            >
                {c('Action').t`Learn more`} <IcArrowOutSquare className="shrink-0" />
            </ButtonLike>
        </>
    );
};

const TrialInfo = () => {
    const [subscription, loadingSubscription] = useSubscription();

    if (loadingSubscription || !subscription) {
        return <Loader />;
    }

    return (
        <div className="relative border rounded px-6 py-5 self-start panel">
            <h3 className="h3 text-bold m-0 pt-0 pb-1">
                <TrialInfoHeader />
            </h3>
            <TrialInfoContent />
            <footer className="flex flex-column gap-2">
                <TrialInfoFooter />
            </footer>
        </div>
    );
};

interface TrialInfoModalProps {
    modalProps: ModalStateProps;
}

export const TrialInfoModal = ({ modalProps }: TrialInfoModalProps) => {
    return (
        <>
            <ModalTwo {...modalProps}>
                <ModalTwoHeader title={<TrialInfoHeader />} />
                <ModalTwoContent>
                    <TrialInfoContent />
                </ModalTwoContent>
                <ModalTwoFooter>
                    <TrialInfoFooter modalProps={modalProps} />
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default TrialInfo;
