import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Tabs } from '@proton/components/components/tabs/Tabs';
import { CYCLE } from '@proton/payments/core/constants';

import type { BillingCycle } from './utils';

import './PlanTierTabs.scss';

export interface PlanTierTabsProps {
    /** The selected billing period. */
    value: BillingCycle;
    /** Updates the selected billing period. */
    onChange: (value: BillingCycle) => void;
    /** Plans shown in the active billing period's panel. */
    children: ReactNode;
    /** Localized yearly savings shown beside the Yearly option. */
    savingsLabel?: string;
}

/**
 * Selects the billing period for the displayed plans.
 * Component in Figma: Lumo/Payments/Billing toggle.
 */
export const PlanTierTabs = ({ value, onChange, children, savingsLabel }: PlanTierTabsProps) => {
    const yearly = c('collider_2025:Label').t`Yearly`;

    return (
        <fieldset className="min-w-0 m-0 p-0 border-none">
            <legend className="sr-only">{c('collider_2025:Label').t`Billing cycle`}</legend>
            <Tabs
                variant="modern"
                contained
                value={value === CYCLE.MONTHLY ? 0 : 1}
                onChange={(index) => onChange(index === 0 ? CYCLE.MONTHLY : CYCLE.YEARLY)}
                className="lumo-plan-tier-tabs"
                navContainerClassName="flex justify-center px-4 py-7"
                contentClassName="lumo-plan-tier-tabs__panel"
                tabs={[
                    { title: c('collider_2025:Label').t`Monthly`, content: children },
                    {
                        title: yearly,
                        content: children,
                        titleNode: savingsLabel ? (
                            <span className="flex flex-nowrap items-center justify-center gap-2 text-nowrap">
                                <span>{yearly}</span>
                                <span className="lumo-plan-tier-tabs__savings px-2 py-0.5 radius-full lumo-label-small lumo-color-glyph-brand-text">
                                    {savingsLabel}
                                </span>
                            </span>
                        ) : undefined,
                    },
                ]}
            />
        </fieldset>
    );
};
