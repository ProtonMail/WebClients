import { ReactNode } from 'react';
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
    return (
        <>
            <div className="mb1">{price}</div>
            <div className="mt1 mb2">{button}</div>
            <PlanCardFeatureList features={plan.features} icon={icon} />
            <div className="pt1 mtauto pb1">
                {footer && <p className="text-sm mt0 plan-selection-additionnal-mentions color-weak">{footer}</p>}
            </div>
        </>
    );
};

export default UpsellPlanCard;
