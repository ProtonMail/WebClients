import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { getPlanFromPlanIDs } from '@proton/shared/lib/helpers/planIDs';

import type { SignupCustomStepProps } from '../interface';
import CustomStepB2B from './CustomStepB2B';
import CustomStepB2C from './CustomStepB2C';

const CustomStep = (props: SignupCustomStepProps) => {
    const plan = getPlanFromPlanIDs(props.model.plansMap, props.model.subscriptionData.planIDs);
    if (plan && getIsB2BAudienceFromPlan(plan.Name)) {
        return <CustomStepB2B {...props} />;
    }
    return <CustomStepB2C {...props} />;
};

export default CustomStep;
