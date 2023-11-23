import { useRef } from 'react';

import { c } from 'ttag';

import { getBankSvg } from '@proton/components/payments/client-extensions/credit-card-type';
import {
    PAYMENT_METHOD_TYPES,
    PayPalDetails,
    SavedCardDetails,
    isPaypalDetails,
    isSavedCardDetails,
} from '@proton/components/payments/core';

import { Bordered } from '../../components';
import useSvgGraphicsBbox from '../../hooks/useSvgGraphicsBbox';

import './PaymentMethodDetails.scss';

const getCreditCardTypeByBrand = (brand: string): string => {
    const CREDIT_CARD_TYPES: {
        [brand: string]: string;
    } = {
        'American Express': 'american-express',
        'Diners Club': 'diners-club',
        Discover: 'discover',
        JCB: 'jcb',
        Maestro: 'maestro',
        MasterCard: 'mastercard',
        UnionPay: 'unionpay',
        Visa: 'visa',
    };

    return CREDIT_CARD_TYPES[brand] ?? '';
};

const PaymentMethodDetailsCard = ({ details }: { details: SavedCardDetails }) => {
    const { Last4, Name, ExpMonth, ExpYear, Brand = '' } = details;

    const cardNumberText = `•••• •••• •••• ${Last4}`;
    const textRef = useRef<SVGTextElement>(null);
    const textBbox = useSvgGraphicsBbox(textRef, [cardNumberText]);
    const textWidth = Math.floor(textBbox.width);

    const bankIcon = getBankSvg(getCreditCardTypeByBrand(Brand));

    return (
        <Bordered className="bg-weak rounded inline-flex flex-column w-full p-7" data-testid="existing-credit-card">
            {bankIcon ? <img width="70" src={bankIcon} alt={Brand} className="mb-4" /> : null}
            <span className="block mb-4 opacity-40">{c('Label').t`Card number`}</span>
            <div className="ratio-container-5-1 text-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inner-ratio-container fill-currentcolor"
                    viewBox={`0 0 ${textWidth} 50`}
                    xmlSpace="preserve"
                >
                    <text x="0px" y="40px" className="card-numbers text-strong text-monospace" ref={textRef}>
                        {cardNumberText}
                    </text>
                </svg>
            </div>
            <div className="flex flex-nowrap max-w-full">
                <div className="flex-item-fluid">
                    {!!Name && (
                        <>
                            <span className="block mb-2 opacity-40">{c('Label').t`Card holder`}</span>
                            <span className="text-xl my-0 inline-block text-ellipsis max-w-full">{Name}</span>
                        </>
                    )}
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
};

const PaymentMethodDetailsPaypal = ({ details }: { details: PayPalDetails }) => {
    const { Payer } = details;

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
};

interface Props {
    type: PAYMENT_METHOD_TYPES.CARD | PAYMENT_METHOD_TYPES.PAYPAL;
    details: SavedCardDetails | PayPalDetails;
}

const PaymentMethodDetails = ({ type, details }: Props) => {
    if (type === PAYMENT_METHOD_TYPES.CARD) {
        if (!isSavedCardDetails(details)) {
            return null;
        }

        return <PaymentMethodDetailsCard details={details} />;
    }

    if (type === PAYMENT_METHOD_TYPES.PAYPAL) {
        if (!isPaypalDetails(details)) {
            return null;
        }

        return <PaymentMethodDetailsPaypal details={details} />;
    }

    return null;
};

export default PaymentMethodDetails;
