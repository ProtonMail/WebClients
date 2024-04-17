import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Icon, SettingsLink, useModalState } from '@proton/components/components';
import { SettingsSection } from '@proton/components/containers/account';
import { useAppTitle, usePlans } from '@proton/components/hooks';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { useCancelSubscriptionFlow } from '../cancelSubscription';
import CancelConfirmationModal from './CancelConfirmationModal';
import CancelRedirectionModal from './CancelRedirectionModal';
import ReminderSectionFeatures from './ReminderSectionFeatures';
import ReminderSectionPlan from './ReminderSectionPlan';
import ReminderSectionStorage from './ReminderSectionStorage';
import ReminderSectionTestimonials from './ReminderSectionTestimonials';
import { getReminderPageConfig } from './reminderPageConfig';
import useB2CCancellationFlow from './useB2CCancellationFlow';

interface Props {
    app: APP_NAMES;
}

export const CancellationReminderSection = ({ app }: Props) => {
    const { hasAccess, plan, redirectToDashboard, subscription, setStartedCancellation } = useB2CCancellationFlow();
    const { cancelSubscription, cancelSubscriptionModals, loadingCancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    const [planResult] = usePlans();
    const [cancelModalProps, setCancelModalOpen, cancelRenderModal] = useModalState();
    const [redirectModalProps, setRedirectModalOpen, redirectRenderModal] = useModalState();

    const freePlan = planResult?.freePlan ?? undefined;
    const rewardedDrive = freePlan ? freePlan.MaxDriveSpace >= freePlan.MaxDriveRewardSpace : false;
    const rewardedMail = freePlan ? freePlan.MaxBaseSpace >= freePlan.MaxBaseRewardSpace : false;

    const [config, setConfig] = useState<ReturnType<typeof getReminderPageConfig> | null>(
        getReminderPageConfig(rewardedDrive, rewardedMail, subscription, plan)
    );

    useEffect(() => {
        const config = getReminderPageConfig(rewardedDrive, rewardedMail, subscription, plan);
        setConfig(config);
    }, [hasAccess]);

    useAppTitle(c('Subscription reminder').t`Cancel subscription`);

    if (!hasAccess || !config) {
        redirectToDashboard();
        return;
    }

    const handleCancelSubscription = async () => {
        setCancelModalOpen(false);
        // We inform that the cancellation process was started to avoid redirection once finished
        setStartedCancellation(true);

        const result = await cancelSubscription(true);
        if (result.status !== 'downgraded') {
            setStartedCancellation(false);
            return;
        }

        setRedirectModalOpen(true);
    };

    return (
        <>
            <div className="overflow-auto">
                <div className="container-section-sticky">
                    <ReminderSectionPlan {...config.reminder} />
                    <ReminderSectionTestimonials {...config.testimonials} />
                    <ReminderSectionFeatures {...config.features} />
                    <ReminderSectionStorage {...config.storage} />
                    <SettingsSection className="container-section-sticky-section flex flex-column-reverse lg:flex-row gap-6 lg:gap-0 items-start justify-space-between">
                        <Button
                            shape="underline"
                            className="color-weak"
                            onClick={() => {
                                setCancelModalOpen(true);
                            }}
                        >{c('Subscription reminder').t`I still want to cancel`}</Button>
                        <div className="flex gap-2">
                            <ButtonLike
                                as="a"
                                href={getStaticURL('/support')}
                                target="_blank"
                                shape="outline"
                                disabled={loadingCancelSubscription}
                            >{c('Subscription reminder').t`Have a question?`}</ButtonLike>
                            <ButtonLike
                                as={SettingsLink}
                                path="/dashboard"
                                shape="solid"
                                color="norm"
                                className="flex flex-nowrap items-center justify-center"
                            >
                                <Icon name="brand-proton-mail-filled-plus" size={5} className="mr-1" />
                                {config.planCta}
                            </ButtonLike>
                        </div>
                    </SettingsSection>
                </div>
            </div>
            {cancelRenderModal && (
                <CancelConfirmationModal
                    {...cancelModalProps}
                    ctaText={config.planCta}
                    features={config.features.features}
                    cancelSubscription={handleCancelSubscription}
                    {...config.confirmationModal}
                />
            )}
            {redirectRenderModal && (
                <CancelRedirectionModal {...redirectModalProps} text={config.redirectModal} plan={config.plan} />
            )}

            {cancelSubscriptionModals}
        </>
    );
};
