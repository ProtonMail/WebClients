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
        <div className="p2">
            <div className="flex flex-nowrap flex row mb1">
                <h2 className="h4 text-bold mt0-25 mb0 text-cut flex-item-fluid">{c('Title').t`Plan summary`}</h2>
                <span className="flex-item-noshrink">
                    <CurrencySelector
                        currency={currency}
                        onSelect={onChangeCurrency}
                        className=""
                        mode="select-two"
                        disabled={loading}
                    />
                </span>
            </div>

            <div className={loading ? 'opacity-50' : ''}>{children}</div>
            <div className="text-sm lh-standard">
                {hasPayments ? (
                    <div className="flex flex-nowrap color-weak mb0-5 mt0-5">
                        <span className="flex-item-noshrink mr0-5">
                            <Icon name="shield" />
                        </span>
                        <span className="flex-item-fluid">{c('Info')
                            .t`Payments are protected with TLS encryption and Swiss privacy laws.`}</span>
                    </div>
                ) : (
                    <div className="flex flex-nowrap mb0-5">
                        <b className="flex-item-fluid">{c('new_plans: info')
                            .t`Applicable credits, proration, and coupons are applied in the next step`}</b>
                    </div>
                )}
                {hasGuarantee && (
                    <div className="flex flex-nowrap color-weak">
                        <span className="flex-item-noshrink mr0-5">
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
