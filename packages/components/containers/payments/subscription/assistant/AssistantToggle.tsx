import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import {
    Badge,
    Icon,
    getScribeUpsellLearnMore,
    useAssistantSubscriptionStatus,
    useAssistantUpsellConfig,
    usePlans,
    useSubscription,
    useSubscriptionModal,
} from '@proton/components';
import { APP_UPSELL_REF_PATH, BRAND_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { hasPlanWithAIAssistantIncluded } from '@proton/shared/lib/helpers/subscription';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { getScribeUpsellText } from './helpers';
import useAssistantToggle from './useAssistantToggle';

const AssistantToggle = () => {
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const [plans] = usePlans();

    const composerAssistantEnabled = useAssistantFeatureEnabled();
    const planWithAIAssistantIncluded = hasPlanWithAIAssistantIncluded(subscription);

    const { hasBoughtPlan, loading } = useAssistantToggle();
    const { trialStatus, trialEndDate } = useAssistantSubscriptionStatus();
    const formattedDate = format(trialEndDate || new Date(), 'PP');

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BUTTON,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_TOGGLE,
        isSettings: true,
    });
    const { assistantUpsellConfig } = useAssistantUpsellConfig({ upsellRef, plans: plans?.plans ?? [] });

    // don't show scribe upsell if user can't pay for it
    if (!composerAssistantEnabled.enabled) {
        return null;
    }

    // We don't want to propose the upsell if the users cannot use the assistant and didn't purchase it beforehand
    if (!composerAssistantEnabled.enabled && !hasBoughtPlan) {
        return null;
    }

    // Visionary users have the add-on for free, we hide this section if that's the case
    if (loading || !assistantUpsellConfig || planWithAIAssistantIncluded) {
        return null;
    }

    const learnMore = (
        <Href href={getScribeUpsellLearnMore()} className="inline-block color-weak">{c('Link').t`Learn more`}</Href>
    );

    const handleCustomize = () => {
        openSubscriptionModal(assistantUpsellConfig);
    };

    return (
        <section className="border rounded flex items-start flex-column gap-2 p-6">
            <div className="flex justify-space-between items-center">
                <div className="flex gap-2 items-center">
                    <Icon name="pen-sparks" size={6} style={{ color: '#D132EA' }} />
                    <p className="m-0 text-bold text-2xl">{c('Info').t`${BRAND_NAME} Scribe writing assistant`}</p>
                    {trialStatus === 'trial-ongoing' ? (
                        <Badge type="info">{c('Assistant toggle').t`Trial in progress`}</Badge>
                    ) : (
                        <Badge type="success">{c('Assistant toggle').t`New`}</Badge>
                    )}
                </div>
            </div>
            <p className="m-0 mb-2 color-weak">
                {getScribeUpsellText()} {learnMore}.
            </p>
            <div className="flex flex-row items-baseline gap-2">
                <Button shape="outline" size="small" onClick={handleCustomize}>{c('Assistant toggle')
                    .t`Buy now`}</Button>
                {trialStatus === 'trial-ongoing' && (
                    <p className="color-weak text-sm m-0">{c('Assistant toggle')
                        .t`Trial expires on ${formattedDate}`}</p>
                )}
            </div>
        </section>
    );
};

export default AssistantToggle;
