import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CurrencySelector, Price, useConfig } from '@proton/components';
import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import {
    getFreeDrivePlan,
    getFreePassPlan,
    getFreePlan,
    getFreeVPNPlan,
    getShortPlan,
} from '@proton/components/containers/payments/features/plan';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { toMap } from '@proton/shared/lib/helpers/object';
import { Currency, Cycle, Plan, PlanIDs, VPNServersCountData } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';
import Loader from './Loader';
import UpsellPlanCard from './UpsellPlanCard';
import { getSignupApplication } from './helper';

interface Props {
    experiment: { loading: boolean; value: string };
    onPlan: (planIDs: PlanIDs) => Promise<void>;
    currency: Currency;
    onChangeCurrency: (currency: Currency) => void;
    cycle: Cycle;
    plans: Plan[];
    onBack?: () => void;
    vpnServers: VPNServersCountData;
    mostPopularPlanName?: PLANS;
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
    if (cycle === CYCLE.THIRTY) {
        return c('new_plans: info').t`* With 30-month subscription. Other subscription options available at checkout.`;
    }
    if (cycle === CYCLE.FIFTEEN) {
        return c('new_plans: info').t`* With 15-month subscription. Other subscription options available at checkout.`;
    }
    return '';
};

const hasNoIcon = (features: PlanCardFeatureDefinition[]) => {
    return features.some((x) => !x.icon || x.icon === 'checkmark');
};

const UpsellStep = ({
    experiment,
    plans,
    vpnServers,
    cycle,
    currency,
    onChangeCurrency,
    onPlan,
    mostPopularPlanName: mostPopularPlanNameProp,
    upsellPlanName,
    onBack,
}: Props) => {
    const { APP_NAME } = useConfig();

    const [loading, withLoading] = useLoading();
    const [type, setType] = useState('free');

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'upsell',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    if (experiment.loading) {
        return (
            <Main className={clsx('sign-layout-upsell')}>
                <Content>
                    <div className="text-center">
                        <Loader />
                    </div>
                </Content>
            </Main>
        );
    }

    const mostPopularPlanName = experiment.value === 'B' ? mostPopularPlanNameProp : undefined;

    const plansMap = toMap(plans, 'Name');

    const shortFreePlan = (() => {
        if (upsellPlanName === PLANS.VPN) {
            return getFreeVPNPlan(vpnServers);
        }

        if (upsellPlanName === PLANS.DRIVE || mostPopularPlanName === PLANS.DRIVE) {
            return getFreeDrivePlan();
        }

        if (upsellPlanName === PLANS.PASS_PLUS) {
            return getFreePassPlan();
        }

        return getFreePlan();
    })();

    const upsellShortPlan = getShortPlan(upsellPlanName, plansMap, {
        vpnServers,
        boldStorageSize: true,
    });
    const upsellPlan = plansMap[upsellPlanName];
    const upsellPlanHumanSize = humanSize(upsellPlan.MaxSpace, undefined, undefined, 0);

    const freeFooterNotes = getFooterNotes(PLANS.FREE, cycle);
    const upsellFooterNotes = getFooterNotes(upsellPlanName, cycle);

    // If there's a feature with a checkmark, don't show any icons
    const noIcon = hasNoIcon(shortFreePlan?.features || []) || hasNoIcon(upsellShortPlan?.features || []);

    const mostPopularPlan = (() => {
        if (!mostPopularPlanName) {
            return null;
        }

        const mostPopularShortPlan = getShortPlan(mostPopularPlanName, plansMap, {
            boldStorageSize: true,
            vpnServers,
        });

        if (!mostPopularShortPlan) {
            return null;
        }

        const mostPopularPlan = plansMap[mostPopularPlanName];
        const mostPopularFooterNotes = getFooterNotes(mostPopularPlanName, cycle);

        return (
            <Main center={false} disableShadow className="sign-layout-upsell sign-layout-upsell-most-popular">
                <div className="absolute top left w100 absolute-center-y absolute-center-x flex flex-justify-center">
                    <div className="rounded-full bg-primary text-uppercase text-semibold px-4 py-1">{c(
                        'new_plans: info'
                    ).t`Most popular`}</div>
                </div>
                <Header title={mostPopularShortPlan.title} />
                <Content>
                    <Text className="mb-2 md:mb-0 text-lg">{mostPopularShortPlan.description}</Text>
                    <UpsellPlanCard
                        icon={!noIcon}
                        plan={mostPopularShortPlan}
                        footer={mostPopularFooterNotes}
                        button={
                            <Button
                                fullWidth
                                color="norm"
                                size="large"
                                loading={loading && type === 'popular'}
                                disabled={loading}
                                onClick={() => {
                                    setType('popular');
                                    void withLoading(onPlan({ [mostPopularShortPlan.plan]: 1 }));
                                }}
                            >
                                {c('new_plans: action').t`Get ${mostPopularShortPlan.title}`}
                            </Button>
                        }
                        price={
                            <Price
                                large
                                currency={currency}
                                suffix={`${c('Suffix').t`/month`}${mostPopularFooterNotes ? '*' : ''}`}
                            >
                                {(mostPopularPlan?.Pricing?.[cycle] || 0) / cycle}
                            </Price>
                        }
                    />
                </Content>
            </Main>
        );
    })();

    return (
        <div
            className={clsx(
                'sign-layout-mobile-columns w100 flex flex-align-items-start flex-justify-center mb-8',
                mostPopularPlanName ? 'sign-layout-three-columns gap-4' : 'gap-6'
            )}
        >
            {shortFreePlan && (
                <Main center={false} className="sign-layout-upsell">
                    <Header title={shortFreePlan.title} onBack={onBack} />
                    <Content>
                        <Text className="mb-2 md:mb-0 text-lg">{shortFreePlan.description}</Text>
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
            {mostPopularPlan}
            {upsellShortPlan && (
                <Main center={false} className="sign-layout-upsell">
                    <Header
                        title={upsellShortPlan.title}
                        right={
                            <div className="inline-block">
                                <CurrencySelector mode="select-two" currency={currency} onSelect={onChangeCurrency} />
                            </div>
                        }
                    />
                    <Content>
                        <Text className="mb-2 md:mb-0 text-lg">{upsellShortPlan.description}</Text>
                        <UpsellPlanCard
                            icon={!noIcon}
                            plan={upsellShortPlan}
                            footer={upsellFooterNotes}
                            button={
                                <Button
                                    fullWidth
                                    color={mostPopularPlan ? 'weak' : 'norm'}
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
