import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
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

    return banksMap[key]().default;
};

const BANKS = {
    'American Express': 'american-express',
    'Diners Club': 'diners-club',
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
            <Bordered className="bg-weak inline-flex flex-column w100 pl2 pr2 pb2">
                {bankIcon ? <img width="70" src={bankIcon} alt={Brand} className="mb1" /> : null}
                <span className="block mb1 opacity-40">{c('Label').t`Card number`}</span>
                <div className="ratio-container-5-1 text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="inner-ratio-container fill-currentColor"
                        viewBox={`0 0 ${textWidth} 50`}
                        xmlSpace="preserve"
                    >
                        <text x="0px" y="40px" className="text-40 text-strong" ref={textRef}>
                            {cardNumberText}
                        </text>
                    </svg>
                </div>
                <div className="flex flex-nowrap max-w100">
                    <div className="flex-item-fluid">
                        <span className="block mb0-5 opacity-40">{c('Label').t`Card holder`}</span>
                        <span className="text-xl mt0 mb0 inline-block text-ellipsis max-w100">{Name}</span>
                    </div>
                    <div className="text-right flex-item-noshrink pl1">
                        <span className="block mb0-5 opacity-40">{c('Label').t`Expires`}</span>
                        <span className="text-xl mt0 mb0">
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
            <Bordered className="p2">
                <div>
                    <img width="70" src={bankIcon} alt="PayPal" className="mb1" />
                </div>
                <div className="flex flex-wrap flex-align-items-center">
                    <label className="flex-item-noshrink mr1" htmlFor="paypal-payer">{c('Label').t`Payer`}</label>
                    <code id="paypal-payer" className="block text-xl mb0 mb1 text-ellipsis" title={Payer}>
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
