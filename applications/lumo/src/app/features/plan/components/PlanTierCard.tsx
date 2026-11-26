import type { ReactElement } from 'react';
import { useId } from 'react';

import { clsx } from 'clsx';
import { Dot } from 'lucide-react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import Radio from '@proton/components/components/input/Radio';
import { CYCLE } from '@proton/payments/core/constants';
import type { LumoTierPlan } from '@proton/payments/core/subscription/lumo-purchase-rules';

import type { TierCardPrice } from './utils';
import { formatLumoPrice, getLumoPlanDetails, getLumoSavingsLabel } from './utils';

import './PlanTierCard.scss';

interface TierCardAction {
    /** Defaults to "Current plan" on the current plan's card. Other cards without a label show no button. */
    label?: string;
    /** Omit to disable the action. */
    onClick?: () => void;
    /** Disables the action while it is unavailable or pending. */
    disabled?: boolean;
}

export interface PlanTierCardProps {
    /** Paid tier represented by the card. Omit for the Free plan. */
    tier?: LumoTierPlan;
    /** Overrides the localized plan title with a title supplied by the caller. */
    title?: string;
    /** Price and billing details for the displayed cycle. */
    price: TierCardPrice;
    /** Highlights the recommended plan or marks the current desktop plan. */
    variant: 'current' | 'recommended' | 'default';
    /** Localized subscription status shown in place of the billing details. */
    note?: string;
    /** Desktop button configuration. Non-current plans need a label to show a button. */
    action?: TierCardAction;
    /** Shows the compact radio card. Defaults to false. */
    compact?: boolean;
    /** Shared radio name for compact cards. Defaults to a name unique to this card. */
    groupId?: string;
    /** Checks the compact card's radio and shows the plan's features. Defaults to false. */
    selected?: boolean;
    /** Selects this compact card. Omit to disable its radio. */
    onSelect?: () => void;
}

// translator: ${price} is a formatted monthly price including the currency symbol. “mo” is short for month.
const getCompactMonthlyPriceLabel = (price: ReactElement | string) => c('collider_2025:Label').jt`${price}/mo`;

/**
 * Displays a Lumo plan's price, features, and subscription action.
 * Component in Figma: Lumo/Payments/Tier card.
 */
export const PlanTierCard = ({
    tier,
    title: titleOverride,
    variant,
    price: cardPrice,
    note,
    action = {},
    compact = false,
    groupId,
    selected = false,
    onSelect,
}: PlanTierCardProps) => {
    const radioId = useId();
    const { title, description, features } = getLumoPlanDetails(tier, titleOverride);
    const { amount, cycle, currency, savings } = cardPrice;
    const monthlyPrice = amount === undefined ? undefined : formatLumoPrice(currency, amount / cycle);
    const previousPrice = savings ? formatLumoPrice(currency, savings.monthlyAmount) : undefined;
    // translator: Badge on the recommended subscription plan.
    const recommendedLabel = c('collider_2025:Label').t`Recommended`;

    const featureItems = features.map(({ id, text }) => (
        <li key={id} className="flex flex-nowrap items-start gap-2.5">
            <Dot
                size={compact ? 18 : 16}
                strokeWidth={6}
                className={clsx('shrink-0', !compact && 'mt-0.5')}
                aria-hidden="true"
            />
            <span>{text}</span>
        </li>
    ));

    if (compact) {
        return (
            <Card
                background={false}
                padded={false}
                rounded="xl"
                className={clsx(
                    'lumo-plan-tier-card lumo-plan-tier-card--compact flex flex-column flex-nowrap min-w-0 lumo-bg-panel',
                    selected ? 'lumo-plan-tier-card--selected border-2' : 'lumo-border-mid'
                )}
            >
                <Radio
                    id={radioId}
                    name={groupId ?? radioId}
                    value={tier}
                    checked={selected}
                    className={clsx(
                        'lumo-plan-tier-card__compact-radio flex flex-nowrap items-start gap-3 w-full px-4 pt-3 cursor-pointer',
                        selected ? 'pb-2.5' : 'pb-3'
                    )}
                    disabled={!onSelect}
                    onChange={onSelect}
                >
                    <span className="flex flex-column flex-nowrap flex-1 gap-0.5 min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="lumo-title-medium text-break">{title}</span>
                            {variant === 'recommended' && (
                                <span className="px-2 py-0.5 radius-full lumo-label-small lumo-color-glyph-inverse lumo-bg-panel-inverse">
                                    {recommendedLabel}
                                </span>
                            )}
                        </span>
                        <span className="lumo-plan-tier-card__compact-detail lumo-body-small text-break lumo-color-glyph-mid">
                            {description}
                        </span>
                    </span>
                    {monthlyPrice !== undefined && (
                        <span className="flex flex-column flex-nowrap shrink-0 gap-0.5 lumo-body-small text-right lumo-color-glyph-mid">
                            <span className="block">
                                {getCompactMonthlyPriceLabel(
                                    <strong key="price" className="mr-0.5 lumo-title-medium lumo-color-glyph">
                                        {monthlyPrice}
                                    </strong>
                                )}
                            </span>
                            {previousPrice && (
                                <s className="lumo-plan-tier-card__compact-detail lumo-color-glyph-low">
                                    {getCompactMonthlyPriceLabel(previousPrice)}
                                </s>
                            )}
                        </span>
                    )}
                </Radio>
                {selected && featureItems.length > 0 && (
                    <ul className="unstyled flex flex-column flex-nowrap gap-1.5 m-0 pr-4 pb-3 pl-12 lumo-body-medium text-break">
                        {featureItems}
                    </ul>
                )}
            </Card>
        );
    }

    // translator: Badge or disabled button label for the user's active subscription plan.
    const currentPlanLabel = c('collider_2025:Label').t`Current plan`;

    let priceDetails = note;
    if (!priceDetails && !tier) {
        priceDetails = c('collider_2025:Label').t`No payment needed`;
    } else if (!priceDetails && cycle === CYCLE.YEARLY && amount !== undefined) {
        const billedAmount = formatLumoPrice(currency, amount);
        // translator: The full price charged once a year. ${billedAmount} includes the currency symbol.
        priceDetails = c('collider_2025:Label').t`${billedAmount} billed yearly`;
    }

    const savingsLabel = savings ? getLumoSavingsLabel(savings.percent) : undefined;
    const actionLabel = action.label ?? (variant === 'current' ? currentPlanLabel : undefined);
    const actionDisabled = action.disabled || !action.onClick;

    const price = (
        <strong key="price" className="lumo-plan-tier-card__price lumo-headline-small lumo-color-glyph">
            {monthlyPrice}
        </strong>
    );
    // translator: A monthly price. ${price} is a formatted amount including the currency symbol.
    const monthlyPriceLabel = c('collider_2025:Label').jt`${price} /month`;

    return (
        <Card
            as="section"
            background={false}
            padded={false}
            rounded="xl"
            className={clsx(
                'lumo-plan-tier-card relative flex flex-column flex-nowrap gap-6 min-w-0 px-5 py-7 text-break lumo-bg-panel',
                variant === 'recommended' ? 'border-1.5 lumo-border-control-strong' : 'lumo-border-mid'
            )}
        >
            {/* Recommendation badge */}
            {variant === 'recommended' && (
                <span className="lumo-plan-tier-card__recommendation absolute top-0 end-0 start-0 w-fit-content mx-auto px-2 py-0.5 radius-full lumo-label-small text-center text-ellipsis lumo-color-glyph-inverse lumo-bg-panel-inverse">
                    {recommendedLabel}
                </span>
            )}

            {/* Plan details */}
            <div className="flex flex-column flex-nowrap gap-1.5">
                <div className="flex flex-wrap items-start justify-space-between gap-2">
                    <h3 className="m-0 lumo-title-large">{title}</h3>
                    {variant === 'current' && (
                        <span className="px-2 py-0.5 radius-full lumo-label-small lumo-color-glyph-mid lumo-bg-control-fill">
                            {currentPlanLabel}
                        </span>
                    )}
                </div>
                {description && <p className="m-0 lumo-body-medium lumo-color-glyph-mid">{description}</p>}
            </div>

            {/* Price details */}
            <div className="lumo-plan-tier-card__pricing flex flex-column flex-nowrap gap-1">
                {previousPrice && <s className="lumo-body-small lumo-color-glyph-mid">{previousPrice}</s>}
                <p className="m-0 lumo-body-medium lumo-color-glyph-mid">
                    {monthlyPrice === undefined ? c('collider_2025:Error').t`Price unavailable` : monthlyPriceLabel}
                </p>
                {(priceDetails || savingsLabel) && (
                    <div className="flex flex-wrap items-center justify-space-between gap-x-2 lumo-body-small lumo-color-glyph-mid">
                        {priceDetails && <span>{priceDetails}</span>}
                        {savingsLabel && (
                            <span className="lumo-plan-tier-card__savings px-2 py-0.5 radius-full lumo-label-small lumo-color-glyph-brand-text">
                                {savingsLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Action button */}
            {actionLabel && (
                <Button
                    className="lumo-plan-tier-card__action"
                    color={variant === 'recommended' ? 'norm' : 'weak'}
                    shape={variant === 'recommended' || (variant === 'current' && actionDisabled) ? 'solid' : 'outline'}
                    fullWidth
                    disabled={actionDisabled}
                    onClick={action.onClick}
                >
                    {actionLabel}
                </Button>
            )}

            {/* Plan features */}
            {featureItems.length > 0 && (
                <ul className="lumo-plan-tier-card__features unstyled flex flex-column flex-nowrap gap-3 m-0 lumo-body-medium">
                    {featureItems}
                </ul>
            )}
        </Card>
    );
};
