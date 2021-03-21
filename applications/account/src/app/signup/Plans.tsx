import React from 'react';
import { c } from 'ttag';
import { Plan } from 'proton-shared/lib/interfaces';

import { MailSubscriptionTable, CycleSelector, CurrencySelector } from 'react-components';
import { SignupModel } from './interfaces';

interface Props {
    model: SignupModel;
    onChange: (model: SignupModel) => void;
    onSelectPlan: (planID: string) => void;
    loading: boolean;
    plans?: Plan[];
    planNameSelected?: string;
}

const Plans = ({ plans = [], planNameSelected = '', model, onChange, onSelectPlan, loading }: Props) => {
    return (
        <>
            <div className="flex flex-nowrap flex-align-items-center on-mobile-flex-column">
                <h1 className="h2 mb0 flex-item-fluid on-mobile-mb1">{c('Title').t`Choose a plan`}</h1>
                <div className="account-form-cycle-currency-selectors flex flex-nowrap">
                    <CycleSelector
                        className="mr1"
                        cycle={model.cycle}
                        onSelect={(cycle: number) => onChange({ ...model, cycle })}
                    />
                    <CurrencySelector
                        currency={model.currency}
                        onSelect={(currency: 'CHF' | 'EUR' | 'USD') => onChange({ ...model, currency })}
                    />
                </div>
            </div>

            <MailSubscriptionTable
                planNameSelected={planNameSelected}
                disabled={loading}
                mode="button"
                selected={c('Status').t`Selected`}
                currentPlan={c('Status').t`Selected plan`}
                plans={plans}
                cycle={model.cycle}
                currency={model.currency}
                onSelect={onSelectPlan}
            />
        </>
    );
};

export default Plans;
