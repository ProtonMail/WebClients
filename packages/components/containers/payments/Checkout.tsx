import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { Currency } from '@proton/shared/lib/interfaces';

import { Icon } from '../../components';
import CurrencySelector from './CurrencySelector';

interface Props {
    currencies: readonly Currency[];
    currency: Currency;
    onChangeCurrency: (newCurrency: Currency) => void;
    loading?: boolean;
    children: ReactNode;
    hasGuarantee?: boolean;
    description?: ReactNode;
    renewNotice: ReactNode;
    hiddenRenewNotice?: ReactNode;
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
    hiddenRenewNotice,
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
                        className=""
                        mode="select-two"
                        disabled={loading}
                    />
                </span>
            </div>

            <div className={loading ? 'opacity-50 *:pointer-events-none' : ''}>{children}</div>
            <div className="text-sm lh-standard">
                {!hiddenRenewNotice && renewNotice && (
                    <div className="flex flex-nowrap color-weak">
                        <span className="shrink-0 mr-2">
                            <Icon name="info-circle" size={4} />
                        </span>
                        <span className="flex-1" data-testid="checkout:renew-notice">
                            {renewNotice}
                        </span>
                    </div>
                )}
                <div className="flex flex-nowrap color-weak my-2">
                    <span className="shrink-0 mr-2">
                        <Icon name="shield" />
                    </span>
                    <span className="flex-1">{c('Info')
                        .t`Payments are protected with TLS encryption and Swiss privacy laws.`}</span>
                </div>
                {hasGuarantee && (
                    <div className="flex flex-nowrap color-weak">
                        <span className="shrink-0 mr-2">
                            <Icon name="clock" />
                        </span>
                        <span className="flex-1">{c('Info').t`30-day money-back guarantee.`}</span>
                    </div>
                )}
            </div>
            {description}
            {hiddenRenewNotice && (
                <div className="mt-4">
                    <hr />
                    <div className="text-sm lh-standard">{hiddenRenewNotice}</div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
