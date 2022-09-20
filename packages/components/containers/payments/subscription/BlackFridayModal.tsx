import { ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { checkSubscription } from '@proton/shared/lib/api/payments';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, CYCLE, DEFAULT_CURRENCY, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Currency, Cycle, PlanIDs, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import { Button, CircleLoader, FormModal, Href, Info, Price } from '../../../components';
import { classnames } from '../../../helpers';
import { useApi, useLoading } from '../../../hooks';
import CurrencySelector from '../CurrencySelector';
import { EligibleOffer } from '../interface';

import './BlackFridayModal.scss';

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
    onSelect: (params: {
        offer: EligibleOffer;
        plan: string;
        cycle: Cycle;
        currency: Currency;
        couponCode?: string | null;
    }) => void;
    className?: string;
    onClose?: () => void;
    offer: EligibleOffer;
}

interface Pricing {
    [index: number]: {
        withCoupon: number;
        withoutCoupon: number;
        withoutCouponMonthly: number;
    };
}

const BlackFridayModal = ({ offer, onSelect, ...rest }: Props) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [currency, updateCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const [pricing, updatePricing] = useState<Pricing>({});

    const isBlackFridayOffer = offer.name === 'black-friday';
    const isProductPayerOffer = offer.name === 'product-payer';

    const title = isBlackFridayOffer
        ? c('blackfriday: VPNspecialoffer Title').t`Get the special year-end offer on our Premium VPN PLUS plan`
        : c('blackfriday Title').t`Save more when combining Mail and VPN`;
    const driveAppName = getAppName(APPS.PROTONDRIVE);

    const DEAL_TITLE = {
        [MONTHLY]: c('blackfriday: VPNspecialoffer Title').t`1 month`,
        [YEARLY]: c('blackfriday: VPNspecialoffer Title').t`12 months`,
        [TWO_YEARS]: c('blackfriday: VPNspecialoffer Title').t`24 months`,
    };

    const BILLED_DESCRIPTION = ({ cycle, amount, notice }: { cycle: Cycle; amount: ReactNode; notice: number }) => {
        const supNotice = <sup key="notice">{notice}</sup>;
        if (cycle === MONTHLY) {
            return c('blackfriday: VPNspecialoffer Title').jt`Billed at ${amount} for the first month.${supNotice}`;
        }
        if (cycle === YEARLY) {
            return c('blackfriday: VPNspecialoffer Title').jt`Billed at ${amount} for the first year.${supNotice}`;
        }
        if (cycle === TWO_YEARS) {
            return c('blackfriday: VPNspecialoffer Title').jt`Billed at ${amount} for the first 2 years.${supNotice}`;
        }
        return null;
    };

    const AFTER_INFO = ({ amount, notice }: { amount: ReactNode; notice: number }) => {
        if (notice === 1) {
            return c('blackfriday: VPNspecialoffer Title')
                .jt`(${notice}) Renews after 2 years at a standard discounted 2-year price of ${amount} (33% discount)`;
        }
        if (notice === 2) {
            return c('blackfriday: VPNspecialoffer Title')
                .jt`(${notice}) Renews after 1 year at a standard discounted annual price of ${amount} (20% discount)`;
        }
        if (notice === 3) {
            return c('blackfriday: VPNspecialoffer Title')
                .jt`(${notice}) Renews after 1 month at a standard monthly price of ${amount}`;
        }
        return null;
    };

    const getCTA = (popular?: boolean) => {
        if (isProductPayerOffer) {
            return c('blackfriday Action').t`Get the offer`;
        }
        if (popular) {
            return c('blackfriday: VPNspecialoffer Action').t`Get the deal now`;
        }
        return c('blackfriday: VPNspecialoffer Action').t`Get the deal`;
    };

    const getFooter = () => {
        if (isProductPayerOffer) {
            return (
                <p className="text-xs color-weak text-center">
                    (1){' '}
                    {c('blackfriday Info')
                        .t`This subscription will automatically renew after 2 years at the same rate until it is cancelled.`}
                </p>
            );
        }

        const standardMonthlyPricing = (
            <Price key="standard-pricing" currency={currency} suffix={c('Suffix for price').t`/month`}>
                {pricing[2]?.withoutCoupon || 0}
            </Price>
        );

        return (
            <>
                <div className="text-xs mt1 mb0 color-weak text-center">
                    <Href url="https://protonvpn.com/support/year-end-offer-terms-2021">
                        {c('blackfriday: VPNspecialoffer Info').t`Special offer Terms and Conditions`}
                    </Href>
                </div>
                <p className="text-xs mt0 mb0 color-weak text-center">{c('blackfriday: VPNspecialoffer Info')
                    .jt`Discounts are based on standard monthly pricing of ${standardMonthlyPricing}`}</p>
                {offer.plans.map((_, index) => {
                    const key = `${index}`;
                    const { withoutCoupon = 0 } = pricing[index] || {};
                    const amount = (
                        <Price key={key} currency={currency} isDisplayedInSentence>
                            {withoutCoupon}
                        </Price>
                    );
                    return (
                        <p key={key} className="text-xs mt0 mb0 color-weak text-center">
                            {AFTER_INFO({ notice: index + 1, amount })}
                        </p>
                    );
                })}
            </>
        );
    };

    const getBundlePrices = async () => {
        try {
            const result = await Promise.all(
                offer.plans.map(({ planIDs, cycle = DEFAULT_CYCLE, couponCode }) => {
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
        } catch (error: any) {
            rest.onClose?.();
            throw error;
        }
    };

    useEffect(() => {
        withLoading(getBundlePrices());
    }, []);

    return (
        <FormModal
            title={title}
            loading={loading}
            footer={null}
            className={classnames(['blackfriday-mail-modal', offer.isVPNOnly && 'blackfriday-mail-modal--vpn'])}
            {...rest}
        >
            {loading ? (
                <div className="text-center">
                    <CircleLoader size="large" className="mxauto flex mb2" />
                </div>
            ) : (
                <>
                    <div
                        className={classnames([
                            'flex flex-nowrap flex-justify-space-around on-mobile-flex-column',
                            isProductPayerOffer ? 'mt2' : 'mt4',
                        ])}
                    >
                        {offer.plans.map(({ name, plan, cycle, planIDs, popular, couponCode }, index) => {
                            const key = `${index}`;
                            const { withCoupon = 0, withoutCouponMonthly = 0 } = pricing[index] || {};
                            const withCouponMonthly = withCoupon / cycle;
                            const percentage = 100 - Math.round((withCouponMonthly * 100) / withoutCouponMonthly);
                            const monthlyPrice = (
                                <Price
                                    currency={currency}
                                    className="blackfriday-monthly-price"
                                    suffix={c('blackfriday: VPNspecialoffer info').t`per month`}
                                    isDisplayedInSentence
                                >
                                    {withCoupon / cycle}
                                </Price>
                            );
                            const amountDue = (
                                <Price key={key} currency={currency} isDisplayedInSentence>
                                    {withCoupon}
                                </Price>
                            );
                            const regularPrice = (
                                <span className={classnames([offer.isVPNOnly === false && 'text-strike'])} key={key}>
                                    <Price currency={currency}>{withoutCouponMonthly * cycle}</Price>
                                </span>
                            );

                            return (
                                <div
                                    key={key}
                                    className={classnames([
                                        'relative flex blackfriday-plan-container',
                                        popular && 'blackfriday-plan-container--mostPopular',
                                        isProductPayerOffer && 'blackfriday-plan-container--productPayer',
                                    ])}
                                >
                                    {percentage ? (
                                        <span
                                            className={classnames([
                                                'text-uppercase text-bold absolute blackfriday-percentage text-center',
                                                popular ? 'bg-danger' : 'bg-primary',
                                            ])}
                                        >
                                            {c('blackfriday: VPNspecialoffer Info').jt`Save ${percentage}%`}
                                        </span>
                                    ) : null}
                                    {popular ? (
                                        <div className="text-uppercase absolute text-bold bg-primary pt0-75 pb0-5 mt0 mb0 text-center blackfriday-mostPopular">
                                            {offer.isVPNOnly
                                                ? c('blackfriday Title').t`Best deal`
                                                : c('blackfriday Title').t`Most popular`}
                                        </div>
                                    ) : null}
                                    <div
                                        className={classnames([
                                            'blackfriday-plan w100 border p1 mb1 flex flex-column flex-align-items-center flex-justify-end',
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
                                                        <strong className="blackfriday-protonDrive-productName ml0-25">
                                                            {driveAppName}
                                                        </strong>
                                                        <Info
                                                            buttonClass="inline-flex color-inherit ml0-25 mb0-1"
                                                            url={getKnowledgeBaseUrl(
                                                                '/protondrive-early-access/?utm_campaign=ww-en-2c-mail-coms_inapp-protondrive_learn_more&utm_source=webmail&utm_medium=app_ad&utm_content=tooltip_v4'
                                                            )}
                                                        />
                                                    </p>
                                                </>
                                            ) : null}
                                        </div>
                                        <Button
                                            color="norm"
                                            shape={popular || isProductPayerOffer ? 'solid' : 'outline'}
                                            className={classnames(['mb1 text-uppercase'])}
                                            onClick={() => {
                                                rest.onClose?.();
                                                onSelect({ offer, plan, cycle, currency, couponCode });
                                            }}
                                        >
                                            {getCTA(popular)}
                                        </Button>
                                        {offer.isVPNOnly ? (
                                            <>
                                                <small className="text-bold text-center color-weak">
                                                    {BILLED_DESCRIPTION({
                                                        cycle,
                                                        amount: amountDue,
                                                        notice: index + 1,
                                                    })}
                                                </small>
                                            </>
                                        ) : (
                                            <>
                                                <small className="text-bold">
                                                    {BILLED_DESCRIPTION({
                                                        cycle,
                                                        amount: amountDue,
                                                        notice: index + 1,
                                                    })}
                                                </small>
                                                <small className="color-weak blackfriday-standardPrice mb1">{c(
                                                    'blackfriday Info'
                                                ).jt`Standard price: ${regularPrice}`}</small>
                                            </>
                                        )}
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
