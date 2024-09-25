import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { Icon, useActiveBreakpoint } from '@proton/components';
import type { ShortPlan } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';

interface Props {
    plan: ShortPlan;
    price: ReactNode;
    button: ReactNode;
    footer?: string;
    icon?: boolean;
}

const UpsellPlanCard = ({ plan, price, footer, button, icon }: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { viewportWidth } = useActiveBreakpoint();

    const footerWrapper = footer ? (
        <p className="text-sm m-0 plan-selection-additionnal-mentions color-weak">{footer}</p>
    ) : null;

    return (
        <>
            <div className="mt-5 mb-2 md:mb-4">{price}</div>
            <div className="mb-0 md:mb-6">{button}</div>

            {!viewportWidth['<=small'] ? (
                <>
                    <div>
                        <PlanCardFeatureList features={plan.features} icon={icon} />
                    </div>
                    <div className="mt-auto">{footerWrapper}</div>
                </>
            ) : (
                <div className="flex flex-column flex-nowrap">
                    {isExpanded ? (
                        <>
                            <PlanCardFeatureList features={plan.features} icon={icon} />
                            <div className="pt-4">{footerWrapper}</div>
                        </>
                    ) : (
                        <>
                            <div className="py-4 mt-auto">{footerWrapper}</div>
                            <InlineLinkButton className="mx-auto" onClick={() => setIsExpanded(true)}>
                                <span>{c('Action').t`See plan features`}</span>
                                <Icon name="chevron-down" className="ml-2" />
                            </InlineLinkButton>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default UpsellPlanCard;
