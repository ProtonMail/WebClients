import { c } from 'ttag';

import { memberThunk } from '@proton/account/member';
import { organizationThunk } from '@proton/account/organization';
import { Button } from '@proton/atoms/index';
import { getAssistantUpsellConfigPlanAndCycle } from '@proton/components/hooks/assistant/assistantUpsellConfig';
import { CYCLE, PLANS, SelectedPlan, getPlanByName, isMainCurrency } from '@proton/payments/index';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';

import { getIsB2CUserAbleToRunScribe } from '../../modals/ComposerAssistantUpsellModal.helpers';
import { getMailUpsellsFooterText } from '../helpers/getUpsellConfigFooterText';
import { getMailUpsellsSubmitText } from '../helpers/getUpsellConfigSubmitText';
import type { MailUpsellConfigCase } from '../interface';

export const getComposerAssistantUpsellConfig: MailUpsellConfigCase = async ({
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

    /** B2C users get the writing assistant for free */
    if (isB2CUser) {
        const planIDs = { [PLANS.DUO]: 1 };
        const cycle = CYCLE.YEARLY;
        const monthlyPrice = await (async () => {
            let price = 0;
            if (!isMainCurrency(currency)) {
                const result = await paymentsApi.checkWithAutomaticVersion({
                    Plans: planIDs,
                    Currency: currency,
                    Cycle: cycle,
                });
                price = result.AmountDue;
            } else {
                price = getPricePerCycle(getPlanByName(plans, planIDs, currency), cycle) || 0;
            }

            return price / 12;
        })();

        return {
            planIDs,
            cycle,
            submitText,
            footerText: getMailUpsellsFooterText({ planIDs, monthlyPrice, currency }),
        };
    }

    // For b2b we don't display the price in the footer
    const latestSubscription = subscription?.UpcomingSubscription ?? subscription;
    const isOrgAdmin = user.isAdmin;
    const selectedPlan = SelectedPlan.createFromSubscription(latestSubscription, plans);
    const assistantUpsellConfig = getAssistantUpsellConfigPlanAndCycle(user, isOrgAdmin, selectedPlan);

    if (assistantUpsellConfig?.planIDs && assistantUpsellConfig.cycle) {
        const { planIDs, cycle, minimumCycle, maximumCycle } = assistantUpsellConfig;

        // const monthlyPrice = await (async () => {
        //     let price = 0;
        //     if (!isMainCurrency(currency)) {
        //         const result = await paymentsApi.checkWithAutomaticVersion({
        //             Plans: planIDs,
        //             Currency: currency,
        //             Cycle: cycle,
        //         });
        //         price = result.AmountDue;
        //     } else {
        //         price = getPricePerCycle(getPlanByName(plans, planIDs, currency), cycle) || 0;
        //     }

        //     return assistantUpsellConfig.cycle === CYCLE.MONTHLY ? price : price / 12;
        // })();

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
            submitText: isOrgUser
                ? (closeModal: () => void) => (
                      <Button
                          size="large"
                          color="norm"
                          shape="solid"
                          fullWidth
                          onClick={() => {
                              closeModal();
                          }}
                      >
                          {c('Action').t`Close`}
                      </Button>
                  )
                : getMailUpsellsSubmitText({ planIDs }),
        };
    }

    throw new Error('No upsell config found');
};
