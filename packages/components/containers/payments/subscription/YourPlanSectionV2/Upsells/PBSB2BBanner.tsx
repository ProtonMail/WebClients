import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import { useSubscriptionModalRaw } from '../../subscriptionModalContext';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import UpsellMultiBox from './UpsellMultiBox';

const PBSB2BBanner = () => {
    const plan = PLANS.BUNDLE_PRO_2024;
    const openSubscriptionModal = useSubscriptionModalRaw();

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            defaultAudience: Audience.B2B,
        });
    };

    return (
        <UpsellMultiBox
            header={
                <PlanIconName
                    logo={<PlanIcon planName={plan} />}
                    topLine={c('Upsell').t`Advanced security for your company`}
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
