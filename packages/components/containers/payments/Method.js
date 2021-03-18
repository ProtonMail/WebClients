import React from 'react';
import PropTypes from 'prop-types';
import { PAYMENT_METHOD_TYPES, CURRENCIES } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import americanExpressSafekeySvgLight from 'design-system/assets/img/shared/bank-icons/american-express-safekey.svg';
import americanExpressSafekeySvgDark from 'design-system/assets/img/shared/bank-icons/american-express-safekey-dark.svg';
import discoverProtectBuySvgLight from 'design-system/assets/img/shared/bank-icons/discover-protectbuy.svg';
import discoverProtectBuySvgDark from 'design-system/assets/img/shared/bank-icons/discover-protectbuy-dark.svg';
import mastercardSecurecodeSvg from 'design-system/assets/img/shared/bank-icons/mastercard-securecode.svg';
import verifiedByVisaSvgLight from 'design-system/assets/img/shared/bank-icons/verified-by-visa.svg';
import verifiedByVisaSvgDark from 'design-system/assets/img/shared/bank-icons/verified-by-visa-dark.svg';

import { Loader } from '../../components';
import CreditCard from './CreditCard';
import PaymentMethodDetails from '../paymentMethods/PaymentMethodDetails';
import PayPalView from './PayPalView';
import Cash from './Cash';
import Bitcoin from './Bitcoin';

const { CARD, PAYPAL, BITCOIN, CASH } = PAYMENT_METHOD_TYPES;

const Alert3DS = () => {
    const verifiedByVisaSvg = getLightOrDark(verifiedByVisaSvgLight, verifiedByVisaSvgDark);
    const discoverProtectBuySvg = getLightOrDark(discoverProtectBuySvgLight, discoverProtectBuySvgDark);
    const americanExpressSafekeySvg = getLightOrDark(americanExpressSafekeySvgLight, americanExpressSafekeySvgDark);
    return (
        <p>
            <div className="mb0-5">{c('Info').t`We use 3-D Secure to protect your payments.`}</div>
            <div className="flex flex-nowrap flex-align-items-center">
                <img width="60" alt="" className="mr1" src={verifiedByVisaSvg} />
                <img width="60" alt="" className="mr1" src={mastercardSecurecodeSvg} />
                <img width="60" alt="" className="mr1" src={discoverProtectBuySvg} />
                <img width="60" alt="" className="mr1" src={americanExpressSafekeySvg} />
            </div>
        </p>
    );
};

const Method = ({
    type,
    amount = 0,
    currency,
    onCard,
    method,
    methods,
    loading,
    card = {},
    errors = {},
    paypal = {},
    paypalCredit = {},
}) => {
    if (loading) {
        return <Loader />;
    }

    if (method === CARD) {
        return (
            <>
                <CreditCard card={card} errors={errors} onChange={onCard} />
                <Alert3DS />
            </>
        );
    }

    if (method === CASH) {
        return <Cash />;
    }

    if (method === BITCOIN) {
        return <Bitcoin amount={amount} currency={currency} type={type} />;
    }

    if (method === PAYPAL) {
        return (
            <PayPalView paypal={paypal} paypalCredit={paypalCredit} amount={amount} currency={currency} type={type} />
        );
    }

    const { Details, Type } = methods.find(({ ID }) => method === ID) || {};

    if (Details) {
        return (
            <>
                <PaymentMethodDetails type={Type} details={Details} />
                {Type === CARD ? <Alert3DS /> : null}
            </>
        );
    }

    return null;
};

Method.propTypes = {
    loading: PropTypes.bool,
    method: PropTypes.string.isRequired,
    methods: PropTypes.array.isRequired,
    type: PropTypes.oneOf(['signup', 'subscription', 'invoice', 'donation', 'credit', 'human-verification']).isRequired,
    amount: PropTypes.number.isRequired,
    card: PropTypes.object.isRequired,
    onCard: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    currency: PropTypes.oneOf(CURRENCIES).isRequired,
    paypal: PropTypes.object,
    paypalCredit: PropTypes.object,
};

export default Method;
