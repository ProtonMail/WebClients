import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { useSubscriptionModal } from '../../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../constants';
import { PlanIcon } from '../../PlanIcon';
import PlanIconName from '../../PlanIconName';
import type { UpsellSectionBaseProps } from '../../YourPlanUpsellsSectionV2';
import UpsellMultiBox from '../UpsellMultiBox';

const DrivePlusFromFreeBanner = ({ app }: UpsellSectionBaseProps) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const { plansMap } = usePreferredPlansMap();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const plan = PLANS.DRIVE;

    const handleGetPlan = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const drivePlusPlanMaxSpace = humanSize({
        bytes: plansMap[plan]?.MaxSpace ?? 214748364800,
        unit: 'GB',
        fraction: 0,
    });

    const planName = PLAN_NAMES[plan];

    return (
        <UpsellMultiBox
            header={
                <PlanIconName
                    logo={<PlanIcon planName={plan} />}
                    topLine={planName}
                    bottomLine={c('Upsell')
                        .t`Get ${drivePlusPlanMaxSpace} storage for your for files, photos and documents, and recover file versions with 10-year file recovery.`}
                />
            }
            headerActionArea={
                <Button color="norm" shape="outline" onClick={handleGetPlan}>
                    {c('Action').t`Upgrade`}
                </Button>
            }
            style="card"
        />
    );
};

export default DrivePlusFromFreeBanner;
