import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { useSubscription, useUser, useVPNServersCount } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useAppTitle from '@proton/components/hooks/useAppTitle';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import { useCancelSubscriptionFlow } from '../cancelSubscription';
import CancelConfirmationModal from './CancelConfirmationModal';
import CancelRedirectionModal from './CancelRedirectionModal';
import ReminderSectionFeatures from './ReminderSectionFeatures';
import ReminderSectionPlan from './ReminderSectionPlan';
import ReminderSectionStorage from './ReminderSectionStorage';
import ReminderSectionTestimonials from './ReminderSectionTestimonials';
import { getReminderPageConfig } from './reminderPageConfig';
import useCancellationFlow from './useCancellationFlow';
import useCancellationTelemetry from './useCancellationTelemetry';

interface Props {
    app: APP_NAMES;
}

export const CancellationReminderSection = ({ app }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [{ paid }] = useVPNServersCount();
    const { b2bAccess, b2cAccess, redirectToDashboard, setStartedCancellation } = useCancellationFlow();
    const { sendCancelPageKeepPlanReport, sendCancelPageConfirmCancelReport } = useCancellationTelemetry();

    const { cancelSubscription, cancelSubscriptionModals, loadingCancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    const [cancelModalProps, setCancelModalOpen, cancelRenderModal] = useModalState();
    const [redirectModalProps, setRedirectModalOpen, redirectRenderModal] = useModalState();

    const [config, setConfig] = useState<ReturnType<typeof getReminderPageConfig> | null>(
        getReminderPageConfig({ subscription, user })
    );

    useEffect(() => {
        const config = getReminderPageConfig({ subscription, vpnCountries: paid.countries, user });
        setConfig(config);
    }, [b2bAccess, b2cAccess, paid]);

    useAppTitle(c('Subscription reminder').t`Cancel subscription`);

    if ((!b2bAccess && !b2cAccess) || !config) {
        redirectToDashboard();
        return;
    }

    const handleCancelSubscription = async () => {
        setCancelModalOpen(false);
        // We inform that the cancellation process was started to avoid redirection once finished
        setStartedCancellation(true);

        const { status } = await cancelSubscription(true);
        if (status === 'cancelled' || status === 'downgraded') {
            setRedirectModalOpen(true);
        }

        setStartedCancellation(false);
    };

    return (
        <>
            <div className="overflow-auto" data-testid="cancellation-flow:reminder-container">
                <div className="container-section-sticky">
                    <ReminderSectionPlan {...config.reminder} />
                    <ReminderSectionTestimonials {...config.testimonials} />
                    <ReminderSectionFeatures {...config.features} />
                    {config.storage && <ReminderSectionStorage {...config.storage} />}
                    <SettingsSection className="container-section-sticky-section">
                        <div className="flex gap-2 border-bottom mb-8 pb-6">
                            <ButtonLike
                                as={SettingsLink}
                                onClick={() => {
                                    sendCancelPageKeepPlanReport();
                                }}
                                path="/dashboard"
                                shape="solid"
                                color="norm"
                                className="flex flex-nowrap items-center justify-center"
                                data-testid="cancellation-flow:keep-plan-button"
                            >
                                <Icon name="upgrade" size={5} className="mr-1" />
                                {c('Subscription reminder').t`Keep ${config.planName}`}
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
                            data-testid="cancellation-flow:confirm-cancellation"
                            onClick={() => {
                                sendCancelPageConfirmCancelReport();
                                setCancelModalOpen(true);
                            }}
                        >{c('Subscription reminder').t`I still want to cancel`}</Button>
                    </SettingsSection>
                </div>
            </div>
            {cancelRenderModal && (
                <CancelConfirmationModal
                    {...cancelModalProps}
                    ctaText={c('Subscription reminder').t`Keep ${config.planName}`}
                    cancelSubscription={handleCancelSubscription}
                    {...config.confirmationModal}
                />
            )}
            {redirectRenderModal && (
                <CancelRedirectionModal {...redirectModalProps} planName={config.planName} plan={config.plan} />
            )}

            {cancelSubscriptionModals}
        </>
    );
};
