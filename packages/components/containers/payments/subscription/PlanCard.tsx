import type { ReactNode } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Price from '@proton/components/components/price/Price';
import { PLANS } from '@proton/shared/lib/constants';
import type { Currency, Cycle } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { PrimaryButton } from '../../../components';

interface Base {
    planName: PLANS;
    planTitle: ReactNode;
    price: number | string;
    info: string;
    features: ReactNode;
    currency: Currency;
    cycle: Cycle;
    isCurrentPlan?: boolean;
    recommended?: boolean;
    canSelect?: boolean;
    actionLabel?: ReactNode;
    enableActionLabelSpacing?: boolean;
}

interface ActionElement {
    actionElement: ReactNode;
}

interface Action {
    action: string;
    onSelect: (planName: PLANS) => void;
    disabled?: boolean;
}

type Props = Base & Partial<ActionElement> & Partial<Action>;

const getCycleUnit = (planName: PLANS) => {
    switch (planName) {
        case PLANS.FREE:
            return '';
        case PLANS.MAIL_PRO:
        case PLANS.MAIL_BUSINESS:
        case PLANS.DRIVE_PRO:
        case PLANS.BUNDLE_PRO:
        case PLANS.BUNDLE_PRO_2024:
        case PLANS.ENTERPRISE:
        case PLANS.PASS_PRO:
        case PLANS.PASS_BUSINESS:
        case PLANS.VPN_PRO:
        case PLANS.VPN_BUSINESS:
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
    actionLabel,
    enableActionLabelSpacing,
    onSelect,
    features,
    currency,
    cycle,
    disabled,
    isCurrentPlan,
    recommended,
    actionElement,
}: Props) => {
    const actionButton = (() => {
        if (actionElement) {
            return actionElement;
        }
        if (onSelect && action) {
            return (
                <PrimaryButton
                    onClick={() => onSelect(planName)}
                    disabled={disabled}
                    className="w-full"
                    aria-describedby={`desc_${planName}`}
                    data-testid={`select-${planName}`}
                >
                    {action}
                </PrimaryButton>
            );
        }
        return null;
    })();

    return (
        <>
            <div
                className={clsx([
                    'border relative h-full plan-selection-plan p-6 pb-0 flex flex-column flex-nowrap',
                    isCurrentPlan && 'plan-selection-plan-current-card',
                    recommended && 'plan-selection-plan-recommended border-primary',
                ])}
                data-testid={planName}
            >
                {recommended ? (
                    <div className="plan-selection-plan-recommended-pill-container text-aligncenter flex">
                        <div className="plan-selection-plan-recommended-pill inline-flex mx-auto bg-primary py-1 px-3">
                            <Icon name="star-filled" className="my-auto" />
                            <span className="ml-1">{c('Title').t`Recommended`}</span>
                        </div>
                    </div>
                ) : null}
                <div className="flex flex-row items-center">
                    <h2 className="h3 plan-selection-title flex text-bold text-capitalize mb-2" id={`desc_${planName}`}>
                        {planTitle}
                    </h2>
                </div>
                <p className="text-lg plan-selection-info text-left color-weak mb-4">{info}</p>
                <div className="mb-4 flex flex-wrap items-baseline plan-selection-price">
                    {typeof price === 'number' ? (
                        <>
                            <span className="mr-2">
                                <Price large currency={currency}>
                                    {price / cycle}
                                </Price>
                            </span>
                            <span className="color-weak plan-selection-suffix text-left">{getCycleUnit(planName)}</span>
                        </>
                    ) : (
                        <span className="mb-5">
                            <Price large className="mb-0.5">
                                {price}
                            </Price>
                        </span>
                    )}
                </div>

                {actionButton}
                {actionLabel || enableActionLabelSpacing ? (
                    <div className="mb-1 plan-selection-spacing">{actionLabel}</div>
                ) : null}

                <div className="flex flex-column flex-nowrap flex-auto text-wrap-balance mt-2">{features}</div>
            </div>
        </>
    );
};

export default PlanCard;
