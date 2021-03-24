import React from 'react';
import { c } from 'ttag';
import { Currency, Cycle } from 'proton-shared/lib/interfaces';
import { CYCLE, PLAN_SERVICES } from 'proton-shared/lib/constants';

import { Icon } from '../../components';
import CycleSelector from './CycleSelector';
import CurrencySelector from './CurrencySelector';

interface Props {
    cycle: Cycle;
    currency: Currency;
    onChangeCycle: (newCycle: Cycle) => void;
    onChangeCurrency: (newCurrency: Currency) => void;
    hideCycle?: boolean;
    hideCurrency?: boolean;
    loading?: boolean;
    children: React.ReactNode;
    service: PLAN_SERVICES;
}

const Checkout = ({
    cycle,
    currency,
    onChangeCycle,
    onChangeCurrency,
    hideCurrency,
    hideCycle,
    loading,
    children,
    service,
}: Props) => {
    return (
        <div className="p2">
            <div className="flex flex-nowrap cycle-currency-selectors mb1">
                {hideCycle ? null : (
                    <div className="flex-item-fluid flex flex-item-grow-2">
                        <CycleSelector
                            cycle={cycle}
                            onSelect={onChangeCycle}
                            disabled={loading}
                            options={[
                                { text: c('Billing cycle option').t`Monthly`, value: CYCLE.MONTHLY },
                                { text: c('Billing cycle option').t`Annually SAVE 20%`, value: CYCLE.YEARLY },
                                { text: c('Billing cycle option').t`Two years SAVE 33%`, value: CYCLE.TWO_YEARS },
                            ]}
                        />
                    </div>
                )}
                {hideCurrency ? null : (
                    <div className="flex-item-fluid flex ml1">
                        <CurrencySelector
                            currency={currency}
                            onSelect={onChangeCurrency}
                            className="flex-item-fluid"
                            disabled={loading}
                        />
                    </div>
                )}
            </div>
            <h2 className="h4 text-bold">{c('Title').t`Plan summary`}</h2>
            <div className={loading ? 'opacity-50' : ''}>{children}</div>
            <p className="text-sm lh-standard flex flex-nowrap color-weak">
                <span className="flex-item-noshrink mr0-5">
                    <Icon name="security" />
                </span>
                <span className="flex-item-fluid">{c('Info')
                    .t`Payments are protected with TLS encryption and Swiss privacy laws.`}</span>
            </p>
            {service === PLAN_SERVICES.VPN ? (
                <p className="text-sm flex flex-nowrap color-weak">
                    <span className="flex-item-noshrink mr0-5">
                        <Icon name="clock" />
                    </span>
                    <span className="flex-item-fluid">{c('Info').t`30 days money-back guarantee.`}</span>
                </p>
            ) : null}
        </div>
    );
};

export default Checkout;
