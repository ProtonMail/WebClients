import { ReactNode } from 'react';

import { c } from 'ttag';

import { Currency } from '@proton/shared/lib/interfaces';

import { Icon } from '../../components';
import CurrencySelector from './CurrencySelector';

interface Props {
    currency: Currency;
    onChangeCurrency: (newCurrency: Currency) => void;
    loading?: boolean;
    children: ReactNode;
    hasGuarantee?: boolean;
    hasPayments?: boolean;
    description?: ReactNode;
}

const Checkout = ({
    currency,
    onChangeCurrency,
    loading,
    children,
    hasGuarantee,
    hasPayments = true,
    description,
}: Props) => {
    return (
        <div className="p-6">
            <div className="flex flex-nowrap flex row mb-5">
                <h2 className="h3 text-bold mt-1 mb-0 text-cut flex-item-fluid">{c('Title').t`Summary`}</h2>
                <span className="flex-item-noshrink" data-testid="checkoutCurrencyDropdown">
                    <CurrencySelector
                        currency={currency}
                        onSelect={onChangeCurrency}
                        className=""
                        mode="select-two"
                        disabled={loading}
                    />
                </span>
            </div>

            <div className={loading ? 'opacity-50 no-pointer-events-children' : ''}>{children}</div>
            <div className="text-sm lh-standard">
                {hasPayments ? (
                    <div className="flex flex-nowrap color-weak my-2">
                        <span className="flex-item-noshrink mr-2">
                            <Icon name="shield" />
                        </span>
                        <span className="flex-item-fluid">{c('Info')
                            .t`Payments are protected with TLS encryption and Swiss privacy laws.`}</span>
                    </div>
                ) : (
                    <div className="flex flex-nowrap mb-2">
                        <b className="flex-item-fluid">{c('new_plans: info')
                            .t`Applicable credits, proration, and coupons are applied in the next step`}</b>
                    </div>
                )}
                {hasGuarantee && (
                    <div className="flex flex-nowrap color-weak">
                        <span className="flex-item-noshrink mr-2">
                            <Icon name="clock" />
                        </span>
                        <span className="flex-item-fluid">{c('Info').t`30-day money-back guarantee.`}</span>
                    </div>
                )}
            </div>
            {description}
        </div>
    );
};

export default Checkout;
