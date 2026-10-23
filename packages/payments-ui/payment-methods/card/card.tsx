import { useRef } from 'react';

import { c } from 'ttag';

import Bordered from '@proton/components/components/container/Bordered';
import useSvgGraphicsBbox from '@proton/components/hooks/useSvgGraphicsBbox';
import type { IconComponent } from '@proton/icons/component';
import { IcBrandAmex } from '@proton/icons/icons/IcBrandAmex';
import { IcBrandDiscover } from '@proton/icons/icons/IcBrandDiscover';
import { IcBrandMastercard } from '@proton/icons/icons/IcBrandMastercard';
import { IcBrandVisa } from '@proton/icons/icons/IcBrandVisa';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedCardDetails } from '@proton/payments/core/interface';
import { type CreditCardType, getBankSvg } from '@proton/payments/core/payment-methods/credit-card-icons';
import { isSavedCardDetails } from '@proton/payments/core/type-guards';

import { maskedLast4 } from '../maskedLast4';
import type { PaymentMethodUi } from '../paymentMethodUi';

import './card.scss';

export const getCreditCardTypeByBrand = (brand: string): CreditCardType => {
    const CREDIT_CARD_TYPES: {
        [brand: string]: CreditCardType;
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

const cardIconByLowercaseBrand: Partial<Record<string, IconComponent>> = {
    'american express': IcBrandAmex,
    visa: IcBrandVisa,
    mastercard: IcBrandMastercard,
    discover: IcBrandDiscover,
};

const SavedCardDetailsView = ({ details }: { details: SavedCardDetails }) => {
    const { Last4, Name, ExpMonth, ExpYear, Brand = '' } = details;

    const cardNumberText = `•••• •••• •••• ${Last4}`;
    const textRef = useRef<SVGTextElement>(null);
    const textBbox = useSvgGraphicsBbox(textRef, [cardNumberText]);
    const textWidth = Math.floor(textBbox.width);

    const bankIcon = getBankSvg(getCreditCardTypeByBrand(Brand));

    return (
        <Bordered className="bg-weak rounded inline-flex flex-column w-full p-7" data-testid="existing-credit-card">
            {bankIcon ? <img width="70" src={bankIcon} alt={Brand} className="mb-4" /> : null}
            <span className="block opacity-40">{c('Label').t`Card number`}</span>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ratio-5/1 fill-currentcolor mb-4"
                viewBox={`0 0 ${textWidth} 50`}
                xmlSpace="preserve"
            >
                <text x="0px" y="40px" className="card-numbers text-strong text-monospace" ref={textRef}>
                    {cardNumberText}
                </text>
            </svg>
            <div className="flex flex-nowrap max-w-full">
                <div className="flex-1">
                    {!!Name && (
                        <>
                            <span className="block mb-2 opacity-40">{c('Label').t`Card holder`}</span>
                            <span className="text-xl my-0 inline-block text-ellipsis max-w-full">{Name}</span>
                        </>
                    )}
                </div>
                <div className="text-right shrink-0 pl-4">
                    <span className="block mb-2 opacity-40">{c('Label').t`Expires`}</span>
                    <span className="text-xl my-0">
                        {ExpMonth}/{ExpYear}
                    </span>
                </div>
            </div>
        </Bordered>
    );
};

export const cardPaymentMethodUi: PaymentMethodUi<PAYMENT_METHOD_TYPES.CHARGEBEE_CARD> = {
    newMethodView: () => ({
        icon: IcCreditCard,
        text: c('Payment method option').t`Credit/debit card`,
    }),
    savedMethodIcon: ({ Brand }) => cardIconByLowercaseBrand[Brand.toLowerCase()] ?? IcCreditCard,
    savedMethodLabel: ({ Brand, Last4 }) =>
        // translator: example would be: "Mastercard" ending in "7777"
        c('new_plans: info').t`${Brand} ending in ${Last4}`,
    renderSavedMethodTableCell: ({ Brand, Last4 }) =>
        Brand && Last4 ? <span data-testid="card-details">{`${Brand} (${maskedLast4(Last4)})`}</span> : null,
    renderSavedMethodDetails: (details) =>
        isSavedCardDetails(details) ? <SavedCardDetailsView details={details} /> : null,
};
