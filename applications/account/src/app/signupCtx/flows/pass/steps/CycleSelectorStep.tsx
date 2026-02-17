import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import type { MaybeNull } from '@proton/pass/types';
import { CYCLE, PLANS } from '@proton/payments/index';
import { usePaymentOptimistic } from '@proton/payments/ui';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { Layout } from '../components/Layout/Layout';
import { passLifetime } from '../plans';

type ItemProps = {
    className?: string;
    label?: ReactNode;
    title: ReactNode;
    subtitle: ReactNode;
    price: ReactNode;
    action: ReactNode;
    onClick: () => void;
};

const Item: FC<ItemProps> = ({ className, label, title, subtitle, price, action, onClick }) => {
    return (
        <div
            className={clsx(
                className,
                'flex flex-column md:flex-row flex-nowrap items-center border rounded-lg mt-12 p-6 gap-4'
            )}
        >
            <div className="flex flex-column flex-nowrap gap-2 md:flex-1 w-full">
                {label}
                <h3 className="text-bold">{title}</h3>
                <h4 className="text-sm color-weak">{subtitle}</h4>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="text-2xl">{price}</div>
                <Button size="large" color="norm" pill onClick={onClick}>
                    {action}
                </Button>
            </div>
        </div>
    );
};

type Props = {
    onContinue: () => void;
    onBack: () => void;
};

export const CycleSelectorStep: FC<Props> = ({ onContinue, onBack }) => {
    const lifetimeFlag = useFlag('PassSimpleLoginLifetimeOffer');
    const payments = usePaymentOptimistic();

    const showLifetime =
        lifetimeFlag &&
        !!payments.selectedPlan.planIDs.pass2023 && // Only show when Pass Plus is selected
        !!payments.plansMap[PLANS.PASS_LIFETIME]; // Lifetime is not available on regional pricing (and will not be in plansMap)

    const getMonthlyPrice = (cycle: CYCLE) => {
        const price = payments.getPriceOrFallback({
            planIDs: payments.selectedPlan.planIDs,
            cycle,
            currency: payments.selectedPlan.currency,
        });

        const pricePerMonthWithCurrency = (
            <span className="text-bold" key="monthly-price-in-bold">
                {getSimplePriceString(price.checkoutUi.currency, price.checkoutUi.withDiscountPerMonth)}
            </span>
        );

        return c('Label').jt`${pricePerMonthWithCurrency} / month`;
    };

    const getYearlyPrice = () => {
        const price = payments.getPriceOrFallback({
            planIDs: payments.selectedPlan.planIDs,
            cycle: CYCLE.YEARLY,
            currency: payments.selectedPlan.currency,
        });

        const priceYearly = getSimplePriceString(price.checkoutUi.currency, price.checkoutUi.withDiscountPerCycle);

        return c('Label').t`Billed at ${priceYearly} every 12 months.`;
    };

    const getPlusLifetimePrice = () => {
        const price = payments.getPriceOrFallback({
            planIDs: passLifetime.planIDs,
            cycle: CYCLE.YEARLY,
            currency: payments.selectedPlan.currency,
        });

        return getSimplePriceString(price.checkoutUi.currency, price.checkoutUi.regularAmountPerCycle);
    };

    const handleSelect = (cycle: MaybeNull<CYCLE>) => {
        if (cycle === null) {
            payments.selectPlan({
                planIDs: passLifetime.planIDs,
                cycle: CYCLE.YEARLY,
                currency: payments.selectedPlan.currency,
            });
        } else {
            payments.selectPlan({
                planIDs: payments.selectedPlan.planIDs,
                cycle,
                currency: payments.selectedPlan.currency,
                // if left unset and using pass plus monthly PASSPLUSINTRO2024 will be used automatically
                // because the price has been checked out to display its price
                // by forcing something else, even invalid, it resets and fix the issue
                coupon: 'none',
            });
        }

        onContinue();
    };

    return (
        <Layout>
            <section className="max-w-custom w-2/3" style={{ '--max-w-custom': '38rem' }}>
                <div className="flex flex-nowrap items-center mb-12">
                    <Button shape="ghost" icon pill onClick={onBack}>
                        <IcArrowLeft size={6} />
                    </Button>
                    <div className="text-center w-full">
                        <h3 className="text-5xl text-bold my-1">{payments.selectedPlan.getPlan().Title}</h3>
                    </div>
                </div>
                <Item
                    className="border-primary"
                    label={
                        <span
                            className="w-fit-content rounded text-semibold px-2 py-1"
                            style={{ backgroundColor: 'var(--interaction-norm)' }}
                        >{c('Label').t`Most popular`}</span>
                    }
                    title={c('Title').t`Annual`}
                    subtitle={getYearlyPrice()}
                    price={getMonthlyPrice(CYCLE.YEARLY)}
                    action={c('Action').t`Select`}
                    onClick={() => handleSelect(CYCLE.YEARLY)}
                />
                <Item
                    title={c('Title').t`Monthly`}
                    subtitle={c('Label').t`Billed monthly.`}
                    price={getMonthlyPrice(CYCLE.MONTHLY)}
                    action={c('Action').t`Select`}
                    onClick={() => handleSelect(CYCLE.MONTHLY)}
                />
                {showLifetime && (
                    <Item
                        className="border-gradient"
                        label={
                            <span
                                className="banner-gradient-bg w-fit-content color-invert rounded text-semibold px-2 py-1"
                                style={{ backgroundColor: 'var(--interaction-norm)' }}
                            >{c('Label').t`Limited time`}</span>
                        }
                        title={c('Title').t`Lifetime`}
                        subtitle={c('Label').t`Pay once, access forever.`}
                        price={getPlusLifetimePrice()}
                        action={c('Action').t`Pay once`}
                        onClick={() => handleSelect(null)}
                    />
                )}
            </section>
        </Layout>
    );
};
