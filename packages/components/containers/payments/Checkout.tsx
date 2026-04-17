import type { ReactNode } from 'react';

import { c } from 'ttag';

import { IcClock } from '@proton/icons/icons/IcClock';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcShield } from '@proton/icons/icons/IcShield';
import type { Currency } from '@proton/payments';

import CurrencySelector from './CurrencySelector';

export interface Props {
    currencies: readonly Currency[];
    currency: Currency;
    onChangeCurrency: (newCurrency: Currency) => void;
    loading?: boolean;
    children: ReactNode;
    hasGuarantee?: boolean;
    description?: ReactNode;
    renewNotice: ReactNode;
    disableCurrencySelector: boolean | undefined;
}

const Checkout = ({
    currencies,
    currency,
    onChangeCurrency,
    loading,
    children,
    hasGuarantee,
    description,
    renewNotice,
    disableCurrencySelector,
}: Props) => {
    return (
        <div className="p-6">
            <div className="flex flex-nowrap mb-5">
                <h2 className="h3 text-bold mt-1 mb-0 text-cut flex-1">{c('Title').t`Summary`}</h2>
                <span className="shrink-0" data-testid="checkoutCurrencyDropdown">
                    <CurrencySelector
                        currencies={currencies}
                        currency={currency}
                        onSelect={onChangeCurrency}
                        mode="select-two"
                        disabled={disableCurrencySelector}
                    />
                </span>
            </div>

            <div className={loading ? 'opacity-50 *:pointer-events-none' : ''}>{children}</div>
            <div className="text-sm lh-standard">
                {renewNotice && (
                    <div className="flex flex-nowrap color-weak">
                        <span className="shrink-0 mr-2">
                            <IcInfoCircle size={4} />
                        </span>
                        <span className="flex-1" data-testid="checkout:renew-notice">
                            {renewNotice}
                        </span>
                    </div>
                )}
                <div className="flex flex-nowrap color-weak my-2">
                    <span className="shrink-0 mr-2">
                        <IcShield />
                    </span>
                    <span className="flex-1">{c('Info')
                        .t`Payments are protected with TLS encryption and Swiss privacy laws.`}</span>
                </div>
                {hasGuarantee && (
                    <div className="flex flex-nowrap color-weak">
                        <span className="shrink-0 mr-2">
                            <IcClock />
                        </span>
                        <span className="flex-1">{c('Info').t`30-day money-back guarantee.`}</span>
                    </div>
                )}
            </div>
            {description}
        </div>
    );
};

export default Checkout;
