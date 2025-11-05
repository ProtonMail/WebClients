import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { Audience } from '@proton/shared/lib/interfaces';

import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionBaseProps } from '../YourPlanUpsellsSectionV2';
import UpsellMultiBox from './UpsellMultiBox';

const PBSB2BBanner = ({ app }: UpsellSectionBaseProps) => {
    const plan = PLANS.BUNDLE_PRO_2024;
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'plans' },
            defaultAudience: Audience.B2B,
            telemetryFlow,
        });
    };

    return (
        <UpsellMultiBox
            header={
                <PlanIconName
                    logo={<PlanIcon planName={plan} />}
                    topLine={c('Upsell').t`Advanced security for your company?`}
                    bottomLine={c('Upsell').t`Protect your organization from data breaches with ${PLAN_NAMES[plan]}.`}
                />
            }
            headerActionArea={
                <>
                    <Button color="norm" shape="outline" onClick={handleExplorePlans}>
                        {c('Action').t`Explore business plans`}
                    </Button>
                </>
            }
            style="card"
        />
    );
};

export default PBSB2BBanner;
