import { c } from 'ttag';

import { leaveOrganization } from '@proton/account/organization/actions';
import { useOrganization } from '@proton/account/organization/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { ModalStateProps } from '../../components/modalTwo/useModalState';
import Prompt from '../../components/prompt/Prompt';

const LeaveFamilyModal = (props: ModalStateProps) => {
    const [loading, withLoading] = useLoading();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleLeave = async () => {
        await withLoading(dispatch(leaveOrganization()));
        createNotification({ text: c('familyOffer_2023:Info').t`You left this plan` });
        props.onClose();
    };

    const handleClose = () => {
        if (loading) {
            return;
        }
        props.onClose();
    };

    if (!organization) {
        return null;
    }

    const withTrial = [PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY].includes(organization.PlanName);

    const planName = PLAN_NAMES[organization.PlanName];
    const message = c('familyOffer_2023:Family plan')
        .t`You will lose access to all premium features included with ${planName}.`;

    return (
        <Prompt
            {...props}
            title={c('Title').t`Leave ${organization.Name}?`}
            footnote={
                withTrial
                    ? c('familyOffer_2023:Family plan')
                          .t`*Only one free trial per user. Regular pricing applies thereafter.`
                    : undefined
            }
            buttons={[
                <Button color="danger" onClick={handleLeave} loading={loading}>{c('Action').t`Leave`}</Button>,
                <Button onClick={handleClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="my-2">{message}</p>
            {!withTrial && (
                <p className="my-2">{c('familyOffer_2023:Family plan')
                    .t`After leaving, you will be moved to a ${BRAND_NAME} Free plan.`}</p>
            )}
            {withTrial && (
                <p className="my-2">{c('familyOffer_2023:Family plan')
                    .t`To ease the transition, we’re giving you a 30-day free trial of ${BRAND_NAME} Unlimited*.`}</p>
            )}
        </Prompt>
    );
};

export default LeaveFamilyModal;
