import { c } from 'ttag';

import { memberThunk } from '@proton/account/member';
import { organizationThunk } from '@proton/account/organization';
import { getAssistantUpsellConfigPlanAndCycle } from '@proton/components/hooks/assistant/assistantUpsellConfig';
import { CYCLE, PLANS, SelectedPlan } from '@proton/payments';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

import { getIsB2CUserAbleToRunScribe } from '../../modals/ComposerAssistantUpsellModal.helpers';
import { UpsellModalComposerAssistantSubmitButton } from '../components/UpsellModalSubmitButtons';
import { getUpsellModalFooterText } from '../helpers/getUpsellModalFooterText';
import { getUpsellPlanMonthlyPrice } from '../helpers/getUpsellPlanMonthlyPrice';
import type { UpsellModalConfigCase } from '../interface';

export const getUpsellModalComposerAssistantConfig: UpsellModalConfigCase = async ({
    currency,
    dispatch,
    paymentsApi,
    plans,
    subscription,
    user,
}) => {
    const [organization, member] = await Promise.all([dispatch(organizationThunk()), dispatch(memberThunk())]);
    const isB2CUser = getIsB2CUserAbleToRunScribe(subscription, organization, member);
    const isOrgUser = isOrganization(organization) && !isSuperAdmin(member ? [member] : []);
    const submitText = c('Action').t`Get the writing assistant`;

    /** B2C user is upsell to DUO plan */
    if (isB2CUser) {
        const planIDs = { [PLANS.DUO]: 1 };
        const cycle = CYCLE.YEARLY;
        const monthlyPrice = await getUpsellPlanMonthlyPrice({
            currency,
            cycle,
            paymentsApi,
            planIDs,
            plans,
        });

        return {
            planIDs,
            cycle,
            submitText,
            footerText: getUpsellModalFooterText({ planIDs, monthlyPrice: monthlyPrice.regularPrice, currency }),
        };
    }

    // For b2b we don't display the price in the footer
    const latestSubscription = subscription?.UpcomingSubscription ?? subscription;
    const isOrgAdmin = user.isAdmin;
    const selectedPlan = SelectedPlan.createFromSubscription(latestSubscription, plans);
    const assistantUpsellConfig = getAssistantUpsellConfigPlanAndCycle(user, isOrgAdmin, selectedPlan);

    if (assistantUpsellConfig?.planIDs && assistantUpsellConfig.cycle) {
        const { planIDs, cycle, minimumCycle, maximumCycle } = assistantUpsellConfig;

        return {
            planIDs,
            cycle,
            configOverride: (config) => {
                config.minimumCycle = minimumCycle;
                config.maximumCycle = maximumCycle;
            },
            // No footer text for b2b users
            footerText: null,
            // Custom submit button for b2b org users
            // Price displayed for B2B
            submitText: isOrgUser ? UpsellModalComposerAssistantSubmitButton : submitText,
        };
    }

    throw new Error('No upsell config found');
};
