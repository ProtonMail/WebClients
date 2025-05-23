import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CurrencySelector, Price, useConfig, useModalState } from '@proton/components';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import {
    getCTA,
    getFreeDrivePlan,
    getFreePassPlan,
    getFreePlan,
    getFreeVPNPlan,
    getShortPlan,
} from '@proton/components/containers/payments/features/plan';
import { useCurrencies } from '@proton/components/payments/client-extensions';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import type { PaymentMethodStatusExtended, PaymentsApi } from '@proton/payments';
import {
    CYCLE,
    type Currency,
    type Cycle,
    type FreePlanDefault,
    PLANS,
    type Plan,
    type PlanIDs,
    getPlansMap,
} from '@proton/payments';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';
import DriveTrial2024UpsellModal from '../single-signup-v2/modals/DriveTrial2024UpsellModal';
import MailTrial2024UpsellModal from '../single-signup-v2/modals/MailTrial2024UpsellModal';
import {
    type CheckTrialPriceParams,
    type CheckTrialPriceResult,
    checkTrialPrice,
} from '../single-signup-v2/modals/Trial2024UpsellModal';
import UpsellPlanCard from './UpsellPlanCard';
import { getSignupApplication } from './helper';

interface Props {
    hasMailTrialUpsell?: boolean;
    hasDriveTrialUpsell?: boolean;
    onPlan: (data: { planIDs: PlanIDs; cycle?: Cycle; coupon?: string }) => Promise<void>;
    currency: Currency;
    onChangeCurrency: (currency: Currency) => void;
    cycle: Cycle;
    plans: Plan[];
    freePlan: FreePlanDefault;
    onBack?: () => void;
    vpnServers: VPNServersCountData;
    mostPopularPlanName?: PLANS;
    upsellPlanName: PLANS;
    currencySignupParam: Currency | undefined;
    paymentStatus: PaymentMethodStatusExtended;
    paymentsApi: PaymentsApi;
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
    hasMailTrialUpsell,
    hasDriveTrialUpsell,
    plans,
    vpnServers,
    freePlan,
    cycle,
    currency,
    onChangeCurrency,
    onPlan,
    mostPopularPlanName,
    upsellPlanName,
    onBack,
    currencySignupParam,
    paymentStatus,
    paymentsApi,
}: Props) => {
    const { APP_NAME } = useConfig();

    const [loading, withLoading] = useLoading();
    const [type, setType] = useState('free');
    const [upsellMailTrialModal, setUpsellMailTrialModal, renderUpsellMailTrialModal] = useModalState();
    const [upsellDriveTrialModal, setUpsellDriveTrialModal, renderUpsellDriveTrialModal] = useModalState();
    const [checkTrialResult, setCheckTrialResult] = useState<CheckTrialPriceResult | undefined>();

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'upsell',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    const plansMap = getPlansMap(plans, currency, false);

    const shortFreePlan = (() => {
        if (upsellPlanName === PLANS.VPN) {
            return getFreeVPNPlan(vpnServers);
        }

        if (upsellPlanName === PLANS.DRIVE || mostPopularPlanName === PLANS.DRIVE) {
            return getFreeDrivePlan(freePlan);
        }

        if (upsellPlanName === PLANS.PASS) {
            return getFreePassPlan();
        }

        return getFreePlan(freePlan);
    })();

    const upsellShortPlan = getShortPlan(upsellPlanName, plansMap, {
        vpnServers,
        boldStorageSize: true,
        freePlan,
    });
    const upsellPlan = plansMap[upsellPlanName];
    const upsellPlanHumanSize = humanSize({ bytes: upsellPlan.MaxSpace, fraction: 0 });

    const freeFooterNotes = getFooterNotes(PLANS.FREE, cycle);
    const upsellFooterNotes = getFooterNotes(upsellPlanName, cycle);

    // If there's a feature with a checkmark, don't show any icons
    const noIcon = hasNoIcon(shortFreePlan?.features || []) || hasNoIcon(upsellShortPlan?.features || []);

    const { getAvailableCurrencies } = useCurrencies();

    const availableCurrencies = getAvailableCurrencies({
        status: paymentStatus,
        plans,
        paramCurrency: currencySignupParam,
    });

    const fetchTrialPrice = async (planName: CheckTrialPriceParams['planName']) => {
        const checkTrialResultPromise = checkTrialPrice({
            paymentsApi,
            plansMap,
            currency,
            planName,
        });

        withLoading(checkTrialResultPromise).catch(noop);

        const checkTrialResult = await checkTrialResultPromise;
        setCheckTrialResult(checkTrialResult);
    };

    const mostPopularPlan = (() => {
        if (!mostPopularPlanName) {
            return null;
        }

        const mostPopularShortPlan = getShortPlan(mostPopularPlanName, plansMap, {
            boldStorageSize: true,
            vpnServers,
            freePlan,
        });

        if (!mostPopularShortPlan) {
            return null;
        }

        const mostPopularPlan = plansMap[mostPopularPlanName];
        const mostPopularFooterNotes = getFooterNotes(mostPopularPlanName, cycle);

        return (
            <Main center={false} disableShadow className="sign-layout-upsell sign-layout-upsell-most-popular">
                <div className="absolute top-0 left-0 w-full inset-center flex justify-center">
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
                                    void withLoading(onPlan({ planIDs: { [mostPopularShortPlan.plan]: 1 } }));
                                }}
                            >
                                {getCTA(mostPopularShortPlan.title)}
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
                'sign-layout-mobile-columns w-full flex items-start justify-center mb-8',
                mostPopularPlanName ? 'sign-layout-three-columns gap-4' : 'gap-6'
            )}
        >
            {renderUpsellMailTrialModal && (
                <MailTrial2024UpsellModal
                    {...upsellMailTrialModal}
                    checkTrialResult={checkTrialResult as CheckTrialPriceResult}
                    onConfirm={async (data) => {
                        setType('mailtrial');
                        await withLoading(onPlan(data));
                    }}
                    onContinue={async () => {
                        setType('free');
                        void withLoading(onPlan({ planIDs: {} }));
                    }}
                />
            )}
            {renderUpsellDriveTrialModal && (
                <DriveTrial2024UpsellModal
                    {...upsellDriveTrialModal}
                    checkTrialResult={checkTrialResult as CheckTrialPriceResult}
                    onConfirm={async (data) => {
                        setType('drivetrial');
                        await withLoading(onPlan(data));
                    }}
                    onContinue={async () => {
                        setType('free');
                        void withLoading(onPlan({ planIDs: {} }));
                    }}
                />
            )}
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
                                    onClick={async () => {
                                        if (hasMailTrialUpsell) {
                                            try {
                                                await fetchTrialPrice(PLANS.MAIL);

                                                setUpsellMailTrialModal(true);
                                                return;
                                            } catch {}
                                        }
                                        if (hasDriveTrialUpsell) {
                                            try {
                                                await fetchTrialPrice(PLANS.DRIVE);

                                                setUpsellDriveTrialModal(true);
                                                return;
                                            } catch {}
                                        }
                                        setType('free');
                                        void withLoading(onPlan({ planIDs: {} }));
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
                                <CurrencySelector
                                    mode="select-two"
                                    currencies={availableCurrencies}
                                    currency={currency}
                                    onSelect={onChangeCurrency}
                                />
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
                                        void withLoading(onPlan({ planIDs: { [upsellShortPlan.plan]: 1 } }));
                                    }}
                                >
                                    {upsellPlanName === PLANS.DRIVE
                                        ? c('new_plans: action').t`Upgrade to ${upsellPlanHumanSize}`
                                        : getCTA(upsellShortPlan.title)}
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
