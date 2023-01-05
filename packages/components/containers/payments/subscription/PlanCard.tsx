import { ReactNode } from 'react';

import { c } from 'ttag';

import { PLANS } from '@proton/shared/lib/constants';
import { Currency, Cycle } from '@proton/shared/lib/interfaces';

import { Badge, Icon, Price, PrimaryButton } from '../../../components';
import { classnames } from '../../../helpers';

interface Props {
    planName: PLANS;
    planTitle: ReactNode;
    price: number;
    info: string;
    action: string;
    onSelect: (planName: PLANS) => void;
    features: ReactNode;
    currency: Currency;
    cycle: Cycle;
    isCurrentPlan?: boolean;
    disabled?: boolean;
    recommended?: boolean;
    canSelect?: boolean;
}

const getCycleUnit = (planName: PLANS) => {
    switch (planName) {
        case PLANS.FREE:
            return '';
        case PLANS.MAIL_PRO:
        case PLANS.DRIVE_PRO:
        case PLANS.BUNDLE_PRO:
        case PLANS.ENTERPRISE:
            return c('Cycle').t`/user per month`;
        default:
            return c('Cycle').t`/month`;
    }
};

const PlanCard = ({
    planName,
    planTitle,
    price,
    info,
    action,
    onSelect,
    features,
    currency,
    cycle,
    disabled,
    isCurrentPlan,
    recommended,
}: Props) => {
    const badgeMultiUser = planName === PLANS.FAMILY ? <Badge type="success">{c('Badge').t`5 users`}</Badge> : null;

    return (
        <>
            <div
                className={classnames([
                    'border relative h100 plan-selection-plan p2 pb0 flex flex-column flex-nowrap',
                    isCurrentPlan && 'plan-selection-plan-current-card',
                    recommended && 'plan-selection-plan-recommended border-primary',
                ])}
            >
                {recommended ? (
                    <div className="plan-selection-plan-recommended-pill-container text-aligncenter flex">
                        <div className="plan-selection-plan-recommended-pill inline-flex mlauto mrauto flex-items-align-center bg-primary p0-25 pl0-75 pr0-75">
                            <Icon name="star-filled" className="myauto" />
                            <span className="ml0-25">{c('Title').t`Recommended`}</span>
                        </div>
                    </div>
                ) : null}
                <div className="flex flex-row flex-align-items-center">
                    <h2
                        className="h3 plan-selection-title flex text-bold text-capitalize mb0-5"
                        id={`desc_${planName}`}
                    >
                        {planTitle}
                    </h2>
                    <span className="ml0-5 mb0-5">{badgeMultiUser}</span>
                </div>
                <p className="text-lg plan-selection-info text-left color-weak mb1">{info}</p>
                <div className="mb1 flex flex-wrap flex-align-items-baseline plan-selection-price">
                    <span className="mr0-5">
                        <Price large currency={currency}>
                            {price / cycle}
                        </Price>
                    </span>
                    <span className="color-weak plan-selection-suffix">{getCycleUnit(planName)}</span>
                </div>

                <PrimaryButton
                    onClick={() => onSelect(planName)}
                    disabled={disabled}
                    className="w100"
                    aria-describedby={`desc_${planName}`}
                >
                    {action}
                </PrimaryButton>
                <div className="flex flex-column flex-nowrap flex-item-fluid-auto mt0-5">{features}</div>
            </div>
        </>
    );
};

export default PlanCard;
