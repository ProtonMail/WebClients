import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS } from '@proton/payments';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionBaseProps } from '../YourPlanUpsellsSectionV2';
import UpsellMultiBox from './UpsellMultiBox';

const VPNB2BBanner = ({ app }: UpsellSectionBaseProps) => {
    const plan = PLANS.VPN_BUSINESS;
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
                    bottomLine={c('Upsell')
                        .t`Protect your organization from data breaches with ${VPN_APP_NAME} for Business.`}
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

export default VPNB2BBanner;
