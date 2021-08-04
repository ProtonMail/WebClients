import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useApi, useConfig, PrimaryButton, Input, useLoading } from '@proton/components';
import { queryCheckVerificationCode } from '@proton/shared/lib/api/user';
import { TOKEN_TYPES } from '@proton/shared/lib/constants';

const RedeemCouponForm = ({ history }) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { CLIENT_TYPE } = useConfig();
    const [couponCode, setCouponCode] = useState('');

    const handleCouponCodeChange = useCallback(({ target: { value } }) => {
        setCouponCode(value);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!couponCode) {
            return;
        }

        const { Plans = [] } = await api(queryCheckVerificationCode(couponCode, TOKEN_TYPES.COUPON, CLIENT_TYPE));
        const [{ Cycle, Name }] = Plans;

        history.push({
            pathname: '/signup',
            state: { coupon: { code: couponCode, cycle: Cycle, plan: Name } },
        });
    };

    return (
        <form className="redeem-form w100 col flex flex-column pb2" onSubmit={(e) => withLoading(handleSubmit(e))}>
            <Input
                autoFocus
                className="redeem-coupon-code-input"
                placeholder={c('Placeholder').t`Enter coupon code`}
                value={couponCode}
                onChange={handleCouponCodeChange}
            />
            <PrimaryButton
                loading={loading}
                disabled={!couponCode}
                type="submit"
                className="redeem-submit-button text-uppercase text-bold mt2 pt1 pb1"
            >
                {c('Action').t`Activate my coupon`}
            </PrimaryButton>
        </form>
    );
};

RedeemCouponForm.propTypes = {
    history: PropTypes.object,
};

export default RedeemCouponForm;
