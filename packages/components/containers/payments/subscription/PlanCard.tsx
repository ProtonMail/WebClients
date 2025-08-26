import type { ReactElement, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Price, { type Props as PriceProps } from '@proton/components/components/price/Price';
import { PLANS } from '@proton/payments';
import clsx from '@proton/utils/clsx';
import isFunction from '@proton/utils/isFunction';

export type HocPriceProps = Omit<PriceProps, 'children'>;
export type HocPrice = (props: HocPriceProps) => ReactElement;

interface Base {
    planName: PLANS;
    planTitle: ReactNode;
    price: string | ReactElement | HocPrice;
    info: string;
    features: ReactNode;
    isCurrentPlan?: boolean;
    recommended?: boolean;
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
        case PLANS.PASS_LIFETIME:
            return '';
        case PLANS.MAIL_PRO:
        case PLANS.MAIL_BUSINESS:
        case PLANS.DRIVE_PRO:
        case PLANS.BUNDLE_PRO:
        case PLANS.BUNDLE_PRO_2024:
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
                <Button
                    color="norm"
                    onClick={() => onSelect(planName)}
                    disabled={disabled}
                    className="w-full"
                    aria-describedby={`desc_${planName}`}
                    data-testid={`select-${planName}`}
                >
                    {action}
                </Button>
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
                    {(() => {
                        const commonPriceProps: HocPriceProps = {
                            large: true,
                        };

                        if (isFunction(price)) {
                            return price({
                                ...commonPriceProps,
                                suffix: getCycleUnit(planName),
                                suffixClassName: 'color-weak plan-selection-suffix text-left',
                                suffixNextLine: true,
                            });
                        }

                        if (typeof price === 'string') {
                            return (
                                <span className="mb-5">
                                    <Price {...commonPriceProps} className="mb-0.5">
                                        {price}
                                    </Price>
                                </span>
                            );
                        }

                        return price;
                    })()}
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
