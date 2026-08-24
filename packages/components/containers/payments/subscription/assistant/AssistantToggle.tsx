import { format } from 'date-fns';
import { c } from 'ttag';

import { useMember } from '@proton/account/member/hook';
import { useOrganization } from '@proton/account/organization/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { IcPenSparks } from '@proton/icons/icons/IcPenSparks';
import { hasAIAssistant, hasPlanWithAIAssistantIncluded } from '@proton/payments/core/subscription/helpers';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { dateLocale } from '@proton/shared/lib/i18n';
import lumoIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import { Badge } from '../../../../components/badge/Badge';
import { getIsB2CUserAbleToRunScribe } from '../../../../components/upsell/modals/ComposerAssistantUpsellModal.helpers';
import useAssistantFeatureEnabled from '../../../../hooks/assistant/useAssistantFeatureEnabled';
import useAssistantSubscriptionStatus from '../../../../hooks/assistant/useAssistantSubscriptionStatus';
import useAssistantUpsellConfig from '../../../../hooks/assistant/useAssistantUpsellConfig';
import { useSubscriptionModal } from '../SubscriptionModalProvider';
import { getScribeUpsellLearnMore, getScribeUpsellText, getScribeWritingAssistantText } from './helpers';

const AssistantToggle = () => {
    const [subscription, subscriptionLoading] = useSubscription();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const [plans] = usePlans();
    const [organization] = useOrganization();
    const [member] = useMember();
    const scribeToLumo = useFlag(MailFeatureFlag.ScribeToLumo);

    const composerAssistantEnabled = useAssistantFeatureEnabled();
    const planWithAIAssistantIncluded = hasPlanWithAIAssistantIncluded(subscription);

    const hasBoughtPlan = hasAIAssistant(subscription);
    const { trialStatus, trialEndDate } = useAssistantSubscriptionStatus();
    const formattedDate = format(trialEndDate || new Date(), 'PPP', {
        locale: dateLocale,
    });

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BUTTON,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_TOGGLE,
        isSettings: true,
    });
    const { assistantUpsellConfig } = useAssistantUpsellConfig({ upsellRef, plans: plans?.plans ?? [] });

    const isB2CUser = getIsB2CUserAbleToRunScribe(subscription, organization, member);

    // Do not show scribe banner to b2c users. The feature is available in Duo plan only for b2c, it's not an addon
    if (isB2CUser) {
        return null;
    }

    // don't show scribe upsell if user can't pay for it
    if (!composerAssistantEnabled.enabled) {
        return null;
    }

    // We don't want to propose the upsell if the users cannot use the assistant and didn't purchase it beforehand
    if (!composerAssistantEnabled.enabled && !hasBoughtPlan) {
        return null;
    }

    // Visionary users have the add-on for free, we hide this section if that's the case
    if (subscriptionLoading || !assistantUpsellConfig || planWithAIAssistantIncluded) {
        return null;
    }

    const learnMore = (
        <Href href={getScribeUpsellLearnMore()} className="inline-block color-weak">{c('Link').t`Learn more`}</Href>
    );

    const handleCustomize = () => {
        void openSubscriptionModal(assistantUpsellConfig);
    };

    return (
        <section className="border rounded flex items-start flex-column gap-2 p-6">
            <div className="flex justify-space-between items-center">
                <div className="flex gap-2 items-center">
                    {scribeToLumo ? (
                        <img src={lumoIcon} alt="" width={24} height={24} />
                    ) : (
                        <IcPenSparks size={6} style={{ color: '#D132EA' }} />
                    )}
                    <p className="m-0 text-bold text-2xl">{getScribeWritingAssistantText(scribeToLumo)}</p>
                    {trialStatus === 'trial-ongoing' && (
                        <Badge type="info">{c('Assistant toggle').t`Trial in progress`}</Badge>
                    )}
                </div>
            </div>
            <p className="m-0 mb-2 color-weak">
                {getScribeUpsellText(scribeToLumo)} {learnMore}.
            </p>
            <div className="flex flex-row items-baseline gap-2">
                <Button shape="outline" size="small" onClick={handleCustomize} loading={loadingSubscriptionModal}>{c(
                    'Assistant toggle'
                ).t`Buy now`}</Button>
                {trialStatus === 'trial-ongoing' && (
                    <p className="color-weak text-sm m-0">{c('Assistant toggle')
                        .t`Trial expires on ${formattedDate}`}</p>
                )}
            </div>
        </section>
    );
};

export default AssistantToggle;
