import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import { PLANS } from '@proton/payments/core/constants';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { Audience } from '@proton/shared/lib/interfaces';

import { getTelemetryUserTier } from '../../../../../helpers/getTelemetryUserTier';
import useDashboardPaymentFlow from '../../../../../hooks/useDashboardPaymentFlow';
import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionBaseProps } from '../YourPlanUpsellsSectionV2';
import UpsellMultiBox from './UpsellMultiBox';

const VPNB2BBanner = ({ app }: UpsellSectionBaseProps) => {
    const plan = PLANS.VPN_BUSINESS;
    const [user] = useUser();
    const api = useApi();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            defaultAudience: Audience.B2B,
            telemetryFlow,
            onMount: () => {
                void sendTelemetryReport({
                    api,
                    delay: false,
                    event: TelemetryAccountDashboardEvents.upsellCtaClick,
                    measurementGroup: TelemetryMeasurementGroups.accountDashboard,
                    dimensions: {
                        app,
                        cta: 'compare_plans',
                        user_tier: getTelemetryUserTier(user),
                    },
                });
            },
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
                    <Button
                        color="norm"
                        shape="outline"
                        loading={loadingSubscriptionModal}
                        onClick={handleExplorePlans}
                    >
                        {c('Action').t`Explore business plans`}
                    </Button>
                </>
            }
            style="card"
        />
    );
};

export default VPNB2BBanner;
