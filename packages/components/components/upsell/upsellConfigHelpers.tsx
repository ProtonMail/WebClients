import type { ReactNode } from 'react';

import { c } from 'ttag';

import { memberThunk } from '@proton/account/member';
import { organizationThunk } from '@proton/account/organization';
import { Button } from '@proton/atoms/index';
import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { getAssistantUpsellConfig } from '@proton/components/hooks/assistant/assistantUpsellConfig';
import { getIsNewBatchCurrenciesEnabled } from '@proton/components/payments/client-extensions';
import {
    COUPON_CODES,
    CYCLE,
    type Currency,
    PLANS,
    PLAN_NAMES,
    type PaymentMethodStatusExtended,
    type PaymentsApi,
    type Plan,
    type PlanIDs,
    SelectedPlan,
    type Subscription,
    getPlanByName,
    getPreferredCurrency,
    isMainCurrency,
} from '@proton/payments';
import type { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME, MAIL_UPSELL_PATHS, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getPlanNameFromIDs } from '@proton/shared/lib/helpers/planIDs';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { isOrganization, isSuperAdmin } from '@proton/shared/lib/organization/helper';
import type useGetFlag from '@proton/unleash/useGetFlag';

import Price from '../price/Price';
import { getIsB2CUserAbleToRunScribe } from './modal/types/ComposerAssistantUpsellModal.helpers';

const ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE = 100;

export const getMailUpsellsSubmitText = ({
    planIDs,
    monthlyPrice,
    currency,
    coupon,
}: {
    planIDs: PlanIDs;
    monthlyPrice: number;
    currency: Currency;
    coupon: string | undefined;
}) => {
    const planID = getPlanNameFromIDs(planIDs);

    if (planID === undefined) {
        return c('Action').t`Upgrade`;
    }

    const planName = PLAN_NAMES[planID];
    const priceCoupon = (
        <Price currency={currency} key="monthlyAmount">
            {monthlyPrice}
        </Price>
    );

    if (coupon) {
        return c('Action').jt`Get ${planName} for ${priceCoupon}`;
    }

    return getPlanOrAppNameText(planName);
};

export const getMailUpsellsFooterText = ({
    planIDs,
    monthlyPrice,
    currency,
    coupon,
}: {
    planIDs: PlanIDs;
    monthlyPrice: number;
    currency: Currency;
    coupon: string | undefined;
}) => {
    const priceLine = (
        <Price
            key="monthly-price"
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {monthlyPrice}
        </Price>
    );

    if (coupon) {
        const priceCoupon = (
            <Price currency={currency} key="monthly-amount">
                {monthlyPrice}
            </Price>
        );

        return c('new_plans: Subtext')
            .jt`The discounted price of ${priceCoupon} is valid for the first month. Then it will automatically be renewed at ${priceLine}. You can cancel at any time.`;
    }

    if (Object.keys(planIDs).includes(PLANS.BUNDLE)) {
        return c('new_plans: Subtext')
            .jt`Unlock all ${BRAND_NAME} premium products and features for just ${priceLine}. Cancel anytime.`;
    }

    if (monthlyPrice) {
        return c('new_plans: Subtext').jt`Starting from ${priceLine}`;
    }

    return null;
};

export const getUserCurrency = async (
    user: UserModel,
    plans: Plan[],
    status: PaymentMethodStatusExtended,
    subscription: Subscription,
    getFlag: ReturnType<typeof useGetFlag>
): Promise<Currency> => {
    const isNewBatchCurrenciesEnabled = getIsNewBatchCurrenciesEnabled(getFlag);
    const currency = getPreferredCurrency({
        user,
        plans,
        status,
        subscription,
        enableNewBatchCurrencies: isNewBatchCurrenciesEnabled,
    });

    return currency;
};

const getUpsellPrice = async ({
    planIDs,
    currency,
    cycle,
    coupon,
    paymentsApi,
}: {
    paymentsApi: PaymentsApi;
    planIDs: PlanIDs;
    currency: Currency;
    cycle: CYCLE;
    coupon: string | undefined;
}) => {
    // TODO pass signal to cancel requeset and maybe silence ?
    const result = await paymentsApi.checkWithAutomaticVersion({
        Plans: planIDs,
        Currency: currency,
        Cycle: cycle,
        CouponCode: coupon,
    });

    return result.AmountDue;
};

interface MailUpsellConfigParams {
    user: UserModel;
    currency: Currency;
    dispatch: ReturnType<typeof useDispatch>;
    plans: Plan[];
    subscription: Subscription;
    upsellRef?: string;
    paymentsApi: PaymentsApi;
}

interface MailUpsellConfig {
    planIDs: PlanIDs;
    cycle: CYCLE;
    coupon?: string;
    configOverride?: (config: OpenCallbackProps) => void;
    footerText: ReactNode;
    submitText: ReactNode | ((closeModal: () => void) => ReactNode);
}

/**
 * @throws if no prices found
 */
export const getMailUpsellConfig: (options: MailUpsellConfigParams) => Promise<MailUpsellConfig> = async ({
    currency,
    dispatch,
    plans,
    subscription,
    user,
    upsellRef,
    paymentsApi,
}) => {
    const isSentinelUpsell = [SHARED_UPSELL_PATHS.SENTINEL, MAIL_UPSELL_PATHS.PROTON_SENTINEL].some((path) =>
        upsellRef?.includes(path)
    );
    const isComposerAssistantUpsell = upsellRef?.includes(MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER);

    let planIDs: PlanIDs | undefined = { [PLANS.BUNDLE]: 1 };
    let cycle: CYCLE | undefined = CYCLE.YEARLY;
    let coupon = undefined;
    let configOverride: MailUpsellConfig['configOverride'] = undefined;
    let price = getPricePerCycle(getPlanByName(plans, planIDs, currency), cycle) || 0;
    let footerText: MailUpsellConfig['footerText'] | undefined;
    let submitText: MailUpsellConfig['submitText'] | undefined;

    if (isComposerAssistantUpsell) {
        const [organization, member] = await Promise.all([dispatch(organizationThunk()), dispatch(memberThunk())]);
        const isB2CUser = getIsB2CUserAbleToRunScribe(subscription, organization, member);
        const isOrgUser = isOrganization(organization) && !isSuperAdmin(member ? [member] : []);

        submitText = c('Action').t`Get the writing assistant`;

        if (isB2CUser) {
            planIDs = { [PLANS.DUO]: 1 };
            cycle = CYCLE.YEARLY;
            price = getPricePerCycle(getPlanByName(plans, planIDs, currency), cycle) || 0;
            if (!isMainCurrency(currency)) {
                price = await getUpsellPrice({
                    coupon,
                    currency,
                    cycle,
                    paymentsApi,
                    planIDs,
                });
            }
        } else {
            // For b2b we don't display the price in the footer
            const latestSubscription = subscription?.UpcomingSubscription ?? subscription;
            const isOrgAdmin = user.isAdmin;
            const selectedPlan = SelectedPlan.createFromSubscription(latestSubscription, plans);
            const assistantUpsellConfig = getAssistantUpsellConfig(user, isOrgAdmin, selectedPlan);

            if (assistantUpsellConfig?.planIDs && assistantUpsellConfig?.cycle) {
                planIDs = assistantUpsellConfig.planIDs;
                cycle = assistantUpsellConfig.cycle;
                configOverride = (config) => {
                    config.minimumCycle = assistantUpsellConfig.minimumCycle;
                    config.maximumCycle = assistantUpsellConfig.maximumCycle;
                };
            }

            // Ensure we display no footer for B2B users
            footerText = null;

            if (isOrgUser) {
                submitText = (closeModal: () => void) => (
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
                );
            }
        }
    } else if (user.isFree && !isSentinelUpsell) {
        planIDs = { [PLANS.MAIL]: 1 };
        cycle = CYCLE.MONTHLY;
        // Free users got 1$ promo displayed
        coupon = COUPON_CODES.TRYMAILPLUS0724;
        if (isMainCurrency(currency)) {
            price = ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE;
        } else {
            price = await getUpsellPrice({
                coupon,
                currency,
                cycle,
                paymentsApi,
                planIDs,
            });
        }
    } else {
        if (!isMainCurrency(currency) && !user.hasPaidMail) {
            price = await getUpsellPrice({
                coupon,
                currency,
                cycle,
                paymentsApi,
                planIDs,
            });
        }
    }

    if (!price) {
        throw new Error('Price not found');
    }

    const monthlyPrice = cycle === CYCLE.MONTHLY ? price : price / 12;
    footerText =
        footerText === undefined ? getMailUpsellsFooterText({ planIDs, monthlyPrice, currency, coupon }) : footerText;
    submitText =
        submitText === undefined ? getMailUpsellsSubmitText({ planIDs, monthlyPrice, currency, coupon }) : submitText;

    return {
        coupon,
        cycle,
        planIDs,
        configOverride,
        footerText,
        submitText,
    };
};
