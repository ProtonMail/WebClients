import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Icon, SettingsLink, useModalState } from '@proton/components/components';
import { SettingsSection } from '@proton/components/containers/account';
import { useAppTitle, useVPNServersCount } from '@proton/components/hooks';
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
    const [{ paid }] = useVPNServersCount();
    const { hasAccess, plan, redirectToDashboard, subscription, setStartedCancellation } = useB2CCancellationFlow();
    const { cancelSubscription, cancelSubscriptionModals, loadingCancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    const [cancelModalProps, setCancelModalOpen, cancelRenderModal] = useModalState();
    const [redirectModalProps, setRedirectModalOpen, redirectRenderModal] = useModalState();

    const [config, setConfig] = useState<ReturnType<typeof getReminderPageConfig> | null>(
        getReminderPageConfig(subscription, plan)
    );

    useEffect(() => {
        const config = getReminderPageConfig(subscription, plan, paid.countries);
        setConfig(config);
    }, [hasAccess, paid]);

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
                    {config.storage && <ReminderSectionStorage {...config.storage} />}
                    <SettingsSection className="container-section-sticky-section">
                        <div className="flex gap-2 border-bottom mb-6 pb-6">
                            <ButtonLike
                                as={SettingsLink}
                                path="/dashboard"
                                shape="solid"
                                color="norm"
                                className="flex flex-nowrap items-center justify-center"
                            >
                                <Icon name={config.keepPlanCTAIcon} size={5} className="mr-1" />
                                {config.keepPlanCTA}
                            </ButtonLike>
                            <ButtonLike
                                as="a"
                                href={getStaticURL('/support')}
                                target="_blank"
                                shape="outline"
                                disabled={loadingCancelSubscription}
                            >{c('Subscription reminder').t`Have a question?`}</ButtonLike>
                        </div>
                        <Button
                            shape="underline"
                            className="color-weak py-0"
                            onClick={() => {
                                setCancelModalOpen(true);
                            }}
                        >{c('Subscription reminder').t`I still want to cancel`}</Button>
                    </SettingsSection>
                </div>
            </div>
            {cancelRenderModal && (
                <CancelConfirmationModal
                    {...cancelModalProps}
                    ctaKeepIcon={config.keepPlanCTAIcon}
                    ctaText={config.keepPlanCTA}
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
