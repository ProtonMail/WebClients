import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    classnames,
    Badge,
    FormModal,
    Loader,
    Button,
    Alert,
    CurrencySelector,
    useLoading,
    useApi,
    useBlackFriday,
    useNotifications,
    Price
} from 'react-components';
import { checkSubscription } from 'proton-shared/lib/api/payments';
import { CYCLE, DEFAULT_CURRENCY, DEFAULT_CYCLE } from 'proton-shared/lib/constants';
import { c } from 'ttag';

const { MONTHLY, YEARLY, TWO_YEARS } = CYCLE;

const BlackFridayModal = ({ bundles = [], onSelect, ...rest }) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [currency, updateCurrency] = useState(DEFAULT_CURRENCY);
    const [pricing, updatePricing] = useState({});
    const isBlackFriday = useBlackFriday();
    const { createNotification } = useNotifications();

    const DEAL_TITLE = {
        [MONTHLY]: c('Title').t`1 month deal`,
        [YEARLY]: c('Title').t`1 year deal`,
        [TWO_YEARS]: c('Title').t`2 year deal`
    };

    const BILLED_DESCRIPTION = ({ cycle, amount, notice }) =>
        ({
            [MONTHLY]: c('Title').jt`Billed as ${amount} (${notice})`,
            [YEARLY]: c('Title').jt`Billed as ${amount} (${notice})`,
            [TWO_YEARS]: c('Title').jt`Billed as ${amount} (${notice})`
        }[cycle]);

    const AFTER_INFO = ({ amount, notice }) =>
        ({
            1: c('Title')
                .jt`(${notice}) Renews after 1 year at a discounted annual price of ${amount} per year (20% discount).`,
            2: c('Title')
                .jt`(${notice}) Renews after 2 years at a discounted 2-year price of ${amount} every 2 years (33% discount).`,
            3: c('Title')
                .jt`(${notice}) Renews after 2 years at a discounted 2-year & bundle price of ${amount} every 2 years (47% discount).`
        }[notice]);

    const getBundlePrices = async () => {
        const result = await Promise.all(
            bundles.map(({ planIDs = [], cycle = DEFAULT_CYCLE, couponCode }) => {
                return Promise.all([
                    api(
                        checkSubscription({
                            PlanIDs: planIDs,
                            CouponCode: couponCode,
                            Currency: currency,
                            Cycle: cycle
                        })
                    ),
                    api(
                        checkSubscription({
                            PlanIDs: planIDs,
                            Currency: currency,
                            Cycle: cycle
                        })
                    ),
                    api(
                        checkSubscription({
                            PlanIDs: planIDs,
                            Currency: currency,
                            Cycle: MONTHLY
                        })
                    )
                ]);
            })
        );

        updatePricing(
            result.reduce((acc, [withCoupon, withoutCoupon, withoutCouponMonthly], index) => {
                acc[index] = {
                    withCoupon: withCoupon.Amount + withCoupon.CouponDiscount,
                    withoutCoupon: withoutCoupon.Amount + withoutCoupon.CouponDiscount, // BUNDLE discount can be applied
                    withoutCouponMonthly: withoutCouponMonthly.Amount,
                    save:
                        withoutCouponMonthly.Amount * withCoupon.Cycle - (withCoupon.Amount + withCoupon.CouponDiscount)
                };
                return acc;
            }, {})
        );
    };

    useEffect(() => {
        withLoading(getBundlePrices());
    }, []);

    useEffect(() => {
        if (!isBlackFriday) {
            rest.onClose();
            createNotification({ text: c('Info').t`Black Friday is over`, type: 'info' });
        }
    }, [isBlackFriday]);

    return (
        <FormModal title={c('Title').t`Black Friday sale`} loading={loading} footer={null} {...rest}>
            {loading ? (
                <Loader />
            ) : (
                <>
                    <Alert>{c('Info').t`Don't miss out on limited time discounts for newcomers!`}</Alert>
                    <div className="flex-autogrid onmobile-flex-column flex-items-end">
                        {bundles.map(({ name, cycle, planIDs, popular, couponCode }, index) => {
                            const key = `${index}`;
                            const { withCoupon = 0, withoutCouponMonthly = 0, save = 0 } = pricing[index] || {};
                            const withCouponMonthly = withCoupon / cycle;
                            const percentage = 100 - Math.round((withCouponMonthly * 100) / withoutCouponMonthly);
                            const monthlyPrice = (
                                <Price currency={currency} className="blackfriday-monthly-price" suffix="/mo">
                                    {withCoupon / cycle}
                                </Price>
                            );
                            const amountDue = (
                                <Price key={key} currency={currency}>
                                    {withCoupon}
                                </Price>
                            );
                            const regularPrice = (
                                <del key={key}>
                                    <Price currency={currency} suffix="/mo">
                                        {withoutCouponMonthly}
                                    </Price>
                                </del>
                            );
                            const savePrice = (
                                <Price key={key} currency={currency}>
                                    {save}
                                </Price>
                            );

                            return (
                                <div key={key} className="flex-autogrid-item">
                                    {popular ? (
                                        <div className="uppercase smaller bold rounded bg-primary color-white mt0 mb0 aligncenter">{c(
                                            'Title'
                                        ).t`Most popular`}</div>
                                    ) : null}
                                    <div className="blackfriday-plan bordered-container p1 mb1 flex flex-column flex-items-center flex-justify-end">
                                        {percentage ? (
                                            <Badge type="primary" className="bold mb1 mr0">
                                                {c('Badge plan').t`${percentage}% off`}
                                            </Badge>
                                        ) : null}
                                        <strong>{DEAL_TITLE[cycle]}</strong>
                                        <strong className="aligncenter">{name}</strong>
                                        <div className={classnames(['h2 mb0', popular && 'color-primary bold'])}>
                                            {monthlyPrice}
                                        </div>
                                        <small className="mb1">{c('Info').jt`Regular price: ${regularPrice}`}</small>
                                        {popular ? (
                                            <small className="mb1 bold uppercase color-primary">
                                                {c('Text').t`Save`} {savePrice}
                                            </small>
                                        ) : null}
                                        <Button
                                            className={classnames([
                                                'mb1',
                                                popular ? 'pm-button--primary' : 'pm-button--primaryborder'
                                            ])}
                                            onClick={() => {
                                                rest.onClose();
                                                onSelect({ planIDs, cycle, currency, couponCode });
                                            }}
                                        >{c('Action').t`Get the deal`}</Button>
                                        <small>
                                            {BILLED_DESCRIPTION({ cycle, amount: amountDue, notice: index + 1 })}
                                        </small>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mb1 aligncenter">
                        <CurrencySelector
                            id="currency-select"
                            mode="buttons"
                            currency={currency}
                            onSelect={updateCurrency}
                        />
                    </div>
                    {bundles.map((b, index) => {
                        const key = `${index}`;
                        const { withoutCoupon = 0 } = pricing[index] || {};
                        const amount = (
                            <Price key={key} currency={currency}>
                                {withoutCoupon}
                            </Price>
                        );
                        return (
                            <p key={key} className="smaller mt0 mb0 opacity-50 aligncenter">
                                {AFTER_INFO({ notice: index + 1, amount })}
                            </p>
                        );
                    })}
                </>
            )}
        </FormModal>
    );
};

BlackFridayModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    bundles: PropTypes.arrayOf(
        PropTypes.shape({
            planIDs: PropTypes.arrayOf(PropTypes.string).isRequired,
            name: PropTypes.string.isRequired,
            cycle: PropTypes.oneOf([MONTHLY, YEARLY, TWO_YEARS]).isRequired,
            couponCode: PropTypes.string,
            percentage: PropTypes.number,
            popular: PropTypes.bool
        })
    )
};

export default BlackFridayModal;
