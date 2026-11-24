import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PLANS } from '@proton/payments/core/constants';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DOCS_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    MEET_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    SHEETS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

import { useSubscriptionModal } from '../../../subscriptionModalContext';
import { PlanIcon } from '../../PlanIcon';
import PlanIconName from '../../PlanIconName';
import UpsellMultiBox from '../UpsellMultiBox';

const WorkspaceBanner = () => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const plan = PLANS.BUNDLE_PRO_2024;

    const handleGetPlan = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            plan: plan,
        });
    };

    return (
        <UpsellMultiBox
            header={
                <PlanIconName
                    logo={<PlanIcon planName={plan} />}
                    topLine={c('Upsell').t`${BRAND_NAME} for Business`}
                    bottomLine={c('Upsell')
                        .t`Everything you need to collaborate securely in a single subscription. Get access to ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${DOCS_SHORT_APP_NAME}, ${SHEETS_SHORT_APP_NAME}, ${MEET_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME} and ${LUMO_SHORT_APP_NAME} AI Assistant.`}
                />
            }
            headerActionArea={
                <Button color="norm" shape="outline" loading={loadingSubscriptionModal} onClick={handleGetPlan}>
                    {c('Action').t`Upgrade`}
                </Button>
            }
            style="promotionGradient"
        />
    );
};

export default WorkspaceBanner;
