import { useFlag } from '@unleash/proxy-client-react';
import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Badge, Icon, useModalState } from '@proton/components/components';
import { useAssistantSubscriptionStatus, useAssistantUpsellConfig, useSubscription } from '@proton/components/hooks';
import { APP_UPSELL_REF_PATH, BRAND_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { hasNewVisionary } from '@proton/shared/lib/helpers/subscription';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { useSubscriptionModal } from '../SubscriptionModalProvider';
import AssistantSubscriptionPrice from './AssistantSubscriptionPrice';
import AssistantToggleDescription from './AssistantToggleDescription';
import DisableAssistantPrompt from './DisableAssistantPrompt';
import useAssistantToggle from './useAssistantToggle';

const AssistantToggle = () => {
    const [subscription] = useSubscription();
    const composerAssistantEnabled = useFlag('ComposerAssistant');
    const hasVisionary = hasNewVisionary(subscription);

    const [openSubscriptionModal] = useSubscriptionModal();
    const [disableAssistantProps, setDisableAssistant, renderDisableAssistant] = useModalState();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_TOGGLE,
    });
    const downgradeRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_TOGGLE_DOWNGRADE,
    });
    const { assistantUpsellConfig, assistantDowngradeConfig } = useAssistantUpsellConfig({ upsellRef, downgradeRef });

    const { hasBoughtPlan, isOrgAdmin, loading, currentAddonSubscription, hasHardwareForModel } = useAssistantToggle();
    const { trialStatus } = useAssistantSubscriptionStatus();

    // We don't want to propose the upsell if the users cannot use the assistant and didn't purchase it beforehand
    if (!composerAssistantEnabled && !hasBoughtPlan) {
        return null;
    }

    if (!assistantUpsellConfig || loading || !hasHardwareForModel) {
        return null;
    }

    const handleButtonClick = () => {
        if (isOrgAdmin || !hasBoughtPlan) {
            openSubscriptionModal(assistantUpsellConfig);
        } else {
            setDisableAssistant(true);
        }
    };

    const handleRenewClick = () => {
        openSubscriptionModal(assistantUpsellConfig);
    };

    // Visionary users have the add-on for free, we hide this section if that's the case
    if (hasVisionary) {
        return null;
    }

    const learnMore = (
        <Href href={getKnowledgeBaseUrl('/proton-scribe-writing-assistant')} className="inline-block color-weak">{c(
            'Link'
        ).t`Learn more`}</Href>
    );

    return (
        <section className="border rounded flex flex-column gap-2 p-6">
            <div className="flex justify-space-between items-center">
                <div className="flex gap-2 items-center">
                    <Icon name="pen-sparks" size={8} style={{ color: '#D132EA' }} />
                    <p className="m-0 text-bold text-3xl">{c('Info').t`Writing assistant`}</p>
                    {trialStatus === 'trial-ongoing' ? (
                        <Badge type="info">{c('Assistant toggle').t`Trial in progress`}</Badge>
                    ) : (
                        <Badge type="success">{c('Assistant toggle').t`New`}</Badge>
                    )}
                </div>
                {hasBoughtPlan && <AssistantSubscriptionPrice subscription={currentAddonSubscription} />}
            </div>
            <p className="m-0 mb-2 text-lg color-weak">{c('Assistant toggle')
                .jt`Take email productivity to new levels. Let ${BRAND_NAME} Scribe help you write, reply to, and proofread your emails. ${learnMore}.`}</p>
            <div className={clsx('flex gap-2 items-center', isOrgAdmin && 'mb-2')}>
                <AssistantToggleDescription onRenewClick={handleRenewClick} onClick={handleButtonClick} />
            </div>
            {renderDisableAssistant && (
                <DisableAssistantPrompt
                    onDisable={() => {
                        if (!assistantDowngradeConfig) {
                            return;
                        }

                        openSubscriptionModal({
                            ...assistantDowngradeConfig,
                        });
                        setDisableAssistant(false);
                    }}
                    {...disableAssistantProps}
                />
            )}
        </section>
    );
};

export default AssistantToggle;
