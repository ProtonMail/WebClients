import React from 'react';
import { c } from 'ttag';
import { Currency, Cycle } from 'proton-shared/lib/interfaces';
import { CYCLE } from 'proton-shared/lib/constants';

import { classnames } from '../../../helpers';
import { Icon, Price, PrimaryButton, Info } from '../../../components';

export interface PlanCardFeature {
    icon?: React.ReactNode;
    content: React.ReactNode;
    className?: string;
    tooltip?: string;
}

interface Props {
    planName: string;
    price: number;
    info: string;
    action: string;
    onClick: () => void;
    features: PlanCardFeature[];
    currency: Currency;
    cycle: Cycle;
    isCurrentPlan?: boolean;
    disabled?: boolean;
}

const PlanCard = ({
    planName,
    price,
    info,
    action,
    onClick,
    features,
    currency,
    cycle,
    disabled,
    isCurrentPlan,
}: Props) => {
    const billedPrice = (
        <Price key="price" currency={currency}>
            {price}
        </Price>
    );
    return (
        <>
            <div
                className={classnames([
                    'bordered relative h100 plan-selection-plan p2',
                    isCurrentPlan && 'plan-selection-plan-current-card',
                ])}
            >
                {isCurrentPlan ? (
                    <div className="text-xs text-uppercase text-bold text-center absolute m0 plan-selection-plan-current">{c(
                        'Title'
                    ).t`Current plan`}</div>
                ) : null}
                <h3 className="plan-selection-title text-bold text-capitalize mb0-5">{planName}</h3>
                <span className="plan-selection-main-price">
                    <Price currency={currency} suffix={c('Suffix for price').t`/ month`}>
                        {price / cycle}
                    </Price>
                </span>
                {cycle === CYCLE.YEARLY ? (
                    <p className="text-sm mt0-5 plan-selection-price">{c('Info')
                        .jt`Billed as ${billedPrice} per year`}</p>
                ) : null}
                {cycle === CYCLE.TWO_YEARS ? (
                    <p className="text-sm mt0-5 plan-selection-price">{c('Info')
                        .jt`Billed as ${billedPrice} every 2 years`}</p>
                ) : null}
                <p className="text-lg plan-selection-info">{info}</p>
                <PrimaryButton onClick={onClick} disabled={disabled} className="w100">
                    {action}
                </PrimaryButton>
                {features.length ? (
                    <ul className="unstyled">
                        {features.map((feature, index) => (
                            <li key={`${index}`} className={classnames(['flex flex-nowrap mb0-5', feature.className])}>
                                <span className="flex-item-noshrink mr1">
                                    {feature.icon || <Icon name="on" className="color-primary" />}
                                </span>
                                <span className="flex-item-fluid">
                                    <span className="mr0-5">{feature.content}</span>
                                    {feature.tooltip ? <Info title={feature.tooltip} /> : null}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </>
    );
};

export default PlanCard;
