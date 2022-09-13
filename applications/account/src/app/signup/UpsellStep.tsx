import { useState } from 'react';

import { c } from 'ttag';

import { Button, CurrencySelector, Price, useLoading } from '@proton/components';
import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { getFreePlan, getFreeVPNPlan, getShortPlan } from '@proton/components/containers/payments/features/plan';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { toMap } from '@proton/shared/lib/helpers/object';
import { Currency, Cycle, Plan, PlanIDs, VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';
import UpsellPlanCard from './UpsellPlanCard';

interface Props {
    onPlan: (planIDs: PlanIDs) => Promise<void>;
    currency: Currency;
    onChangeCurrency: (currency: Currency) => void;
    cycle: Cycle;
    plans: Plan[];
    onBack?: () => void;
    vpnCountries: VPNCountries;
    vpnServers: VPNServers;
    upsellPlanName: PLANS;
}

const getFooterNotes = (planName: PLANS, cycle: Cycle): string => {
    if (planName === PLANS.FREE) {
        return c('Info').t`* No credit card required.`;
    }
    if (cycle === CYCLE.MONTHLY) {
        return c('new_plans: info').t`* With 1-month subscription. Other subscription options available at checkout.`;
    }
    if (cycle === CYCLE.YEARLY) {
        return c('new_plans: info').t`* With 12-month subscription. Other subscription options available at checkout.`;
    }
    if (cycle === CYCLE.TWO_YEARS) {
        return c('new_plans: info').t`* With 24-month subscription. Other subscription options available at checkout.`;
    }
    return '';
};

const hasNoIcon = (features: PlanCardFeatureDefinition[]) => {
    return features.some((x) => !x.icon || x.icon === 'checkmark');
};

const UpsellStep = ({
    plans,
    vpnServers,
    vpnCountries,
    cycle,
    currency,
    onChangeCurrency,
    onPlan,
    upsellPlanName,
    onBack,
}: Props) => {
    const plansMap = toMap(plans, 'Name');

    const shortFreePlan = upsellPlanName === PLANS.VPN ? getFreeVPNPlan(vpnCountries, vpnServers) : getFreePlan();

    const upsellShortPlan = getShortPlan(upsellPlanName, plansMap, vpnCountries, vpnServers);
    const upsellPlan = plansMap[upsellPlanName];
    const upsellPlanHumanSize = humanSize(upsellPlan.MaxSpace, undefined, undefined, 0);

    const [loading, withLoading] = useLoading();
    const [type, setType] = useState('free');

    const freeFooterNotes = getFooterNotes(PLANS.FREE, cycle);
    const upsellFooterNotes = getFooterNotes(upsellPlanName, cycle);

    // If there's a feature with a checkmark, don't show any icons
    const noIcon = hasNoIcon(shortFreePlan?.features || []) || hasNoIcon(upsellShortPlan?.features || []);

    return (
        <div className="sign-layout-two-column w100 flex flex-align-items-start flex-justify-center flex-gap-2">
            {shortFreePlan && (
                <Main center={false} className="on-tablet-mb2 sign-layout-upsell">
                    <Header title={shortFreePlan.title} onBack={onBack} />
                    <Content>
                        <Text className="on-mobile-mb0-5">{shortFreePlan.description}</Text>
                        <UpsellPlanCard
                            icon={!noIcon}
                            plan={shortFreePlan}
                            footer={getFooterNotes(shortFreePlan.plan, cycle)}
                            button={
                                <Button
                                    fullWidth
                                    color="norm"
                                    shape="outline"
                                    size="large"
                                    loading={loading && type === 'free'}
                                    disabled={loading}
                                    onClick={() => {
                                        setType('free');
                                        void withLoading(onPlan({}));
                                    }}
                                >{c('new_plans: action').t`Continue with Free`}</Button>
                            }
                            price={
                                <Price
                                    large
                                    currency={currency}
                                    suffix={`${c('Suffix').t`/month`}${freeFooterNotes ? '*' : ''}`}
                                >
                                    {0}
                                </Price>
                            }
                        />
                    </Content>
                </Main>
            )}
            {upsellShortPlan && (
                <Main center={false} className="sign-layout-upsell">
                    <Header
                        title={upsellShortPlan.title}
                        right={
                            <div className="inline-block mt2 on-mobile-mt1">
                                <CurrencySelector mode="select-two" currency={currency} onSelect={onChangeCurrency} />
                            </div>
                        }
                    />
                    <Content>
                        <Text className="on-mobile-mb0-5">{upsellShortPlan.description}</Text>
                        <UpsellPlanCard
                            icon={!noIcon}
                            plan={upsellShortPlan}
                            footer={upsellFooterNotes}
                            button={
                                <Button
                                    fullWidth
                                    color="norm"
                                    size="large"
                                    loading={loading && type === 'bundle'}
                                    disabled={loading}
                                    onClick={() => {
                                        setType('bundle');
                                        void withLoading(onPlan({ [upsellShortPlan.plan]: 1 }));
                                    }}
                                >
                                    {upsellPlanName === PLANS.DRIVE
                                        ? c('new_plans: action').t`Upgrade to ${upsellPlanHumanSize}`
                                        : c('new_plans: action').t`Get ${upsellShortPlan.title}`}
                                </Button>
                            }
                            price={
                                <Price
                                    large
                                    currency={currency}
                                    suffix={`${c('Suffix').t`/month`}${upsellFooterNotes ? '*' : ''}`}
                                >
                                    {(upsellPlan?.Pricing?.[cycle] || 0) / cycle}
                                </Price>
                            }
                        />
                    </Content>
                </Main>
            )}
        </div>
    );
};

export default UpsellStep;
