import React, { useEffect, useState } from 'react';
import { checkSubscription } from 'proton-shared/lib/api/payments';
import { APPS, CYCLE, DEFAULT_CURRENCY, DEFAULT_CYCLE } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { Currency, Cycle, PlanIDs, SubscriptionCheckResponse } from 'proton-shared/lib/interfaces';
import { isProductPayer } from 'proton-shared/lib/helpers/blackfriday';

import { getAppName } from 'proton-shared/lib/apps/helper';
import { FormModal, FullLoader, Button, Price, Info } from '../../../components';
import { useLoading, useApi, useSubscription } from '../../../hooks';
import { classnames } from '../../../helpers';
import CurrencySelector from '../CurrencySelector';
import './BlackFridayModal.scss';
import BlackFridayModalDescription from './BlackFridayModalDescription';
import useBlackFridayModalTitle from './useBlackFridayModalTitle';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

export interface Bundle {
    planIDs: PlanIDs;
    name: string;
    cycle: Cycle;
    couponCode?: string;
    percentage?: number;
    popular?: boolean;
}

interface Props {
    onSelect: (params: { planIDs: PlanIDs; cycle: Cycle; currency: Currency; couponCode?: string | null }) => void;
    bundles: Bundle[];
    className?: string;
    onClose?: () => void;
}

interface Pricing {
    [index: number]: {
        withCoupon: number;
        withoutCoupon: number;
        withoutCouponMonthly: number;
    };
}

const BlackFridayModal = ({ bundles = [], onSelect, ...rest }: Props) => {
    const api = useApi();
    const [subscription] = useSubscription();
    const productPayer = isProductPayer(subscription);
    const [loading, withLoading] = useLoading();
    const [currency, updateCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const [pricing, updatePricing] = useState<Pricing>({});
    const title = useBlackFridayModalTitle(productPayer);
    const driveAppName = getAppName(APPS.PROTONDRIVE);

    const DEAL_TITLE = {
        [MONTHLY]: c('blackfriday Title').t`for 1 month`,
        [YEARLY]: c('blackfriday Title').t`for 1 year`,
        [TWO_YEARS]: c('blackfriday Title').t`for 2 years`,
    };

    const BILLED_DESCRIPTION = ({
        cycle,
        amount,
        notice,
    }: {
        cycle: Cycle;
        amount: React.ReactNode;
        notice: number;
    }) => {
        const supNotice = <sup key="notice">{notice}</sup>;
        if (cycle === MONTHLY) {
            return c('blackfriday Title').jt`Billed as ${amount} ${supNotice}`;
        }
        if (cycle === YEARLY) {
            return c('blackfriday Title').jt`Billed as ${amount} ${supNotice}`;
        }
        if (cycle === TWO_YEARS) {
            return c('blackfriday Title').jt`Billed as ${amount} ${supNotice}`;
        }
        return null;
    };

    const AFTER_INFO = ({ amount, notice }: { amount: React.ReactNode; notice: number }) => {
        if (notice === 1) {
            return c('blackfriday Title')
                .jt`(${notice}) Renews after 1 year at a discounted annual price of ${amount} every year (20% discount).`;
        }
        if (notice === 2) {
            return c('blackfriday Title')
                .jt`(${notice}) Renews after 2 years at a discounted 2-year price of ${amount} every 2 years (47% discount).`;
        }
        if (notice === 3) {
            return c('blackfriday Title')
                .jt`(${notice}) Renews after 1 year at a discounted annual & bundle price of ${amount} every year (36% discount).`;
        }
        return null;
    };

    const getCTA = () => {
        if (productPayer) {
            return c('blackfriday Action').t`Upgrade`;
        }
        return c('blackfriday Action').t`Get limited-time deal`;
    };

    const getFooter = () => {
        if (productPayer) {
            return (
                <p className="text-xs color-weak text-center">
                    (1){' '}
                    {c('blackfriday Info')
                        .t`This subscription will automatically renew after 2 years at the same rate until it is cancelled.`}
                </p>
            );
        }
        return (
            <>
                {bundles.map((b, index) => {
                    const key = `${index}`;
                    const { withoutCoupon = 0 } = pricing[index] || {};
                    const amount = (
                        <Price key={key} currency={currency}>
                            {withoutCoupon}
                        </Price>
                    );
                    return (
                        <p key={key} className="text-xs mt0 mb0 color-weak text-center">
                            {AFTER_INFO({ notice: index + 1, amount })}
                        </p>
                    );
                })}
                <p className="text-xs mt1 mb0 color-weak text-center">{c('blackfriday Info')
                    .t`Discounts are based on monthly pricing.`}</p>
                <p className="text-xs mt0 mb0 color-weak text-center">{c('blackfriday Info')
                    .t`Offer valid only for first-time paid subscriptions.`}</p>
            </>
        );
    };

    const getBundlePrices = async () => {
        try {
            const result = await Promise.all(
                bundles.map(({ planIDs = [], cycle = DEFAULT_CYCLE, couponCode }) => {
                    return Promise.all([
                        api<SubscriptionCheckResponse>(
                            checkSubscription({
                                PlanIDs: planIDs,
                                CouponCode: couponCode,
                                Currency: currency,
                                Cycle: cycle,
                            })
                        ),
                        api<SubscriptionCheckResponse>(
                            checkSubscription({
                                PlanIDs: planIDs,
                                Currency: currency,
                                Cycle: cycle,
                            })
                        ),
                        api<SubscriptionCheckResponse>(
                            checkSubscription({
                                PlanIDs: planIDs,
                                Currency: currency,
                                Cycle: MONTHLY,
                            })
                        ),
                    ]);
                })
            );

            updatePricing(
                result.reduce<Pricing>((acc, [withCoupon, withoutCoupon, withoutCouponMonthly], index) => {
                    acc[index] = {
                        withCoupon: withCoupon.Amount + (withCoupon.CouponDiscount || 0),
                        withoutCoupon: withoutCoupon.Amount + (withoutCoupon.CouponDiscount || 0), // BUNDLE discount can be applied
                        withoutCouponMonthly: withoutCouponMonthly.Amount,
                    };
                    return acc;
                }, {})
            );
        } catch (error) {
            rest.onClose?.();
            throw error;
        }
    };

    useEffect(() => {
        withLoading(getBundlePrices());
    }, []);

    return (
        <FormModal title={title} loading={loading} footer={null} {...rest}>
            {loading ? (
                <div className="text-center">
                    <FullLoader size={50} className="center flex mb2" />
                </div>
            ) : (
                <>
                    <BlackFridayModalDescription isProductPayer={productPayer} />
                    <div
                        className={classnames([
                            'flex flex-nowrap flex-justify-space-around on-mobile-flex-column',
                            productPayer ? 'mt2' : 'mt4',
                        ])}
                    >
                        {bundles.map(({ name, cycle, planIDs, popular, couponCode }, index) => {
                            const key = `${index}`;
                            const { withCoupon = 0, withoutCouponMonthly = 0 } = pricing[index] || {};
                            const withCouponMonthly = withCoupon / cycle;
                            const percentage = 100 - Math.round((withCouponMonthly * 100) / withoutCouponMonthly);
                            const monthlyPrice = (
                                <Price
                                    currency={currency}
                                    className="blackfriday-monthly-price"
                                    suffix={c('blackfriday info').t`per month`}
                                >
                                    {withCoupon / cycle}
                                </Price>
                            );
                            const amountDue = (
                                <Price key={key} currency={currency}>
                                    {withCoupon}
                                </Price>
                            );
                            const regularPrice = (
                                <span className="text-strike" key={key}>
                                    <Price currency={currency}>{withoutCouponMonthly * cycle}</Price>
                                </span>
                            );

                            return (
                                <div
                                    key={key}
                                    className={classnames([
                                        'relative flex blackfriday-plan-container',
                                        popular && 'blackfriday-plan-container--mostPopular',
                                        productPayer && 'blackfriday-plan-container--productPayer',
                                    ])}
                                >
                                    {percentage ? (
                                        <span
                                            className={classnames([
                                                'text-uppercase text-bold absolute blackfriday-percentage text-center',
                                                popular ? 'bg-danger' : 'bg-primary',
                                            ])}
                                        >
                                            {c('blackfriday Info').jt`Save ${percentage}%`}
                                        </span>
                                    ) : null}
                                    {popular ? (
                                        <div className="text-uppercase absolute text-bold bg-primary pt0-75 pb0-5 mt0 mb0 text-center blackfriday-mostPopular">{c(
                                            'blackfriday Title'
                                        ).t`Most popular`}</div>
                                    ) : null}
                                    <div
                                        className={classnames([
                                            'blackfriday-plan w100 bordered p1 mb1 flex flex-column flex-align-items-center flex-justify-end',
                                            popular && 'border-color-primary',
                                        ])}
                                    >
                                        <div className="blackfriday-plan-namePeriod">
                                            <strong className="blackfriday-plan-name block text-center text-lg mt0-5 mb0">
                                                {name}
                                            </strong>
                                            <strong className="block text-center">{DEAL_TITLE[cycle]}</strong>
                                        </div>
                                        <div className="mb1 mt1 text-center lh130">{monthlyPrice}</div>
                                        <div className="text-center flex-item-fluid-auto">
                                            {Object.keys(planIDs).length > 1 ? (
                                                <>
                                                    <p className="m0">{c('blackfriday Info').t`Includes`}</p>
                                                    <p className={classnames(['mt0', popular && 'color-success'])}>
                                                        {c('blackfriday Info').t`early access to`}
                                                        <strong className="blackfriday-protonDrive-productName ml0-25">
                                                            {driveAppName}
                                                        </strong>
                                                        <Info
                                                            buttonClass="inline-flex color-inherit ml0-25 mb0-1"
                                                            url="https://protonmail.com/support/knowledge-base/protondrive-early-access/?utm_campaign=ww-en-2c-mail-coms_inapp-protondrive_learn_more&utm_source=webmail&utm_medium=app_ad&utm_content=tooltip_v4"
                                                        />
                                                        <span className="block">
                                                            <span className="blackfriday-protonDrive-free bg-success text-uppercase text-bold pl0-5 pr0-5">
                                                                {c('blackfriday Info').t`Free`}
                                                            </span>
                                                        </span>
                                                    </p>
                                                </>
                                            ) : null}
                                        </div>
                                        <Button
                                            color="norm"
                                            shape={popular || productPayer ? 'outline' : undefined}
                                            className={classnames(['mb1 text-uppercase'])}
                                            onClick={() => {
                                                rest.onClose?.();
                                                onSelect({ planIDs, cycle, currency, couponCode });
                                            }}
                                        >
                                            {getCTA()}
                                        </Button>
                                        <small className="text-bold">
                                            {BILLED_DESCRIPTION({ cycle, amount: amountDue, notice: index + 1 })}
                                        </small>
                                        <small className="color-weak blackfriday-standardPrice mb1">{c(
                                            'blackfriday Info'
                                        ).jt`Standard price: ${regularPrice}`}</small>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mb1 text-center blackfriday-currency-selector">
                        <CurrencySelector
                            id="currency-select"
                            mode="buttons"
                            currency={currency}
                            onSelect={updateCurrency}
                        />
                    </div>
                    {getFooter()}
                </>
            )}
        </FormModal>
    );
};

export default BlackFridayModal;
