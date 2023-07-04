import { useRef } from 'react';

import PropTypes from 'prop-types';
import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';

import { Bordered } from '../../components';
import useSvgGraphicsBbox from '../../hooks/useSvgGraphicsBbox';

const banks = require.context('@proton/styles/assets/img/credit-card-icons', true, /.svg$/);

const banksMap = banks.keys().reduce((acc, key) => {
    acc[key] = () => banks(key);
    return acc;
}, {});

const getBankSvg = (type = '') => {
    const key = `./cc-${type}.svg`;

    if (!banksMap[key]) {
        return;
    }

    return banksMap[key]();
};

const BANKS = {
    'American Express': 'american-express',
    'Diners Club': 'diners-club',
    Discover: 'discover',
    JCB: 'jcb',
    Maestro: 'maestro',
    MasterCard: 'mastercard',
    UnionPay: 'unionpay',
    Visa: 'visa',
};

const PaymentMethodDetails = ({ type, details = {} }) => {
    const { Last4, Name, ExpMonth, ExpYear, Payer, Brand = '' } = details;

    const cardNumberText = `•••• •••• •••• ${Last4}`;
    const textRef = useRef();
    const textBbox = useSvgGraphicsBbox(textRef, [cardNumberText]);
    const textWidth = Math.floor(textBbox.width);

    if (type === PAYMENT_METHOD_TYPES.CARD) {
        const bankIcon = getBankSvg(BANKS[Brand]);
        return (
            <Bordered className="bg-weak rounded inline-flex flex-column w100 p-7" data-testid="existing-credit-card">
                {bankIcon ? <img width="70" src={bankIcon} alt={Brand} className="mb-4" /> : null}
                <span className="block mb-4 opacity-40">{c('Label').t`Card number`}</span>
                <div className="ratio-container-5-1 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inner-ratio-container fill-currentColor"
                        viewBox={`0 0 ${textWidth} 50`}
                        xmlSpace="preserve"
                    >
                        <text x="0px" y="40px" className="text-40 text-strong text-monospace" ref={textRef}>
                            {cardNumberText}
                        </text>
                    </svg>
                </div>
                <div className="flex flex-nowrap max-w100">
                    <div className="flex-item-fluid">
                        <span className="block mb-2 opacity-40">{c('Label').t`Card holder`}</span>
                        <span className="text-xl my-0 inline-block text-ellipsis max-w100">{Name}</span>
                    </div>
                    <div className="text-right flex-item-noshrink pl-4">
                        <span className="block mb-2 opacity-40">{c('Label').t`Expires`}</span>
                        <span className="text-xl my-0">
                            {ExpMonth}/{ExpYear}
                        </span>
                    </div>
                </div>
            </Bordered>
        );
    }

    if (type === PAYMENT_METHOD_TYPES.PAYPAL) {
        const bankIcon = getBankSvg('paypal');
        return (
            <Bordered className="p-7 rounded" data-testid="existing-paypal">
                <div>
                    <img width="70" src={bankIcon} alt="PayPal" className="mb-4" />
                </div>
                <div className="flex flex-wrap flex-align-items-center">
                    <label className="flex-item-noshrink mr-4" htmlFor="paypal-payer">{c('Label').t`Payer`}</label>
                    <code id="paypal-payer" className="block text-xl mb-0 mb-4 text-ellipsis" title={Payer}>
                        {Payer}
                    </code>
                </div>
            </Bordered>
        );
    }

    return null;
};

PaymentMethodDetails.propTypes = {
    type: PropTypes.string.isRequired,
    details: PropTypes.object.isRequired,
};

export default PaymentMethodDetails;
