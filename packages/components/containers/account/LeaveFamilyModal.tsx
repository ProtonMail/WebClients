import { c } from 'ttag';

import { leaveOrganization } from '@proton/account/organization/actions';
import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { isOrganizationFamily, isOrganizationPassFamily } from '@proton/shared/lib/organization/helper';

interface Props extends ModalStateProps {
    organisationName: string;
}

const family = PLAN_NAMES[PLANS.FAMILY];
const passFamily = PLAN_NAMES[PLANS.PASS_FAMILY];
const duo = PLAN_NAMES[PLANS.DUO];

const LeaveFamilyModal = ({ organisationName, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleLeave = async () => {
        await withLoading(dispatch(leaveOrganization()));
        createNotification({ text: c('familyOffer_2023:Info').t`You left this plan` });
        rest.onClose();
    };

    const handleClose = () => {
        if (loading) {
            return;
        }
        rest.onClose();
    };

    let plan;
    if (isOrganizationFamily(organization)) {
        plan = family;
    } else if (isOrganizationPassFamily(organization)) {
        plan = passFamily;
    } else {
        plan = duo;
    }

    const withTrial = organization?.PlanName === PLANS.DUO || organization?.PlanName === PLANS.FAMILY;

    const message = c('familyOffer_2023:Family plan')
        .t`You will lose access to all premium features included with ${plan}.`;

    return (
        <Prompt
            {...rest}
            title={c('Title').t`Leave ${organisationName}?`}
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
