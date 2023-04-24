import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Icon, InlineLinkButton, useActiveBreakpoint } from '@proton/components/';
import { ShortPlan } from '@proton/components/containers/payments/features/interface';
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
    const { isNarrow } = useActiveBreakpoint();

    const footerWrapper = footer ? (
        <p className="text-sm mt-0 plan-selection-additionnal-mentions color-weak">{footer}</p>
    ) : null;

    return (
        <>
            <div className="mb-2 md:mb-4">{price}</div>
            <div className="mb-0 md:mb-8">{button}</div>

            {!isNarrow ? (
                <>
                    <div>
                        <PlanCardFeatureList features={plan.features} icon={icon} />
                    </div>
                    <div className="pt1 mtauto pb1">{footerWrapper}</div>
                </>
            ) : (
                <div className="flex flex-column flex-nowrap">
                    {isExpanded ? (
                        <>
                            <PlanCardFeatureList features={plan.features} icon={icon} />
                            <div className="pt1">{footerWrapper}</div>
                        </>
                    ) : (
                        <>
                            <div className="pt1 mt-auto pb1">{footerWrapper}</div>
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
