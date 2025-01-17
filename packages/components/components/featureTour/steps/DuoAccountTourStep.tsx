import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { userThunk } from '@proton/account/user';
import { ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import duoPlanBackground from '@proton/styles/assets/img/onboarding/duoPlan.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayDuoAccountTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
    return user.isAdmin && organization.PlanName === PLANS.DUO && organization.UsedMembers <= 1;
};

const DuoAccountTourStep = (props: FeatureTourStepProps) => {
    const protonDuoPlanName = PLAN_NAMES[PLANS.DUO];

    return (
        <FeatureTourStepsContent
            title={c('Title').t`Set up ${protonDuoPlanName}`}
            description={c('Info')
                .t`Invite your partner, a friend, or whoever you're sharing your ${protonDuoPlanName} plan with.`}
            illustration={duoPlanBackground}
            illustrationSize="medium"
            descriptionClassName="mb-16"
            primaryButton={
                <ButtonLike
                    as={SettingsLink}
                    path="/multi-user-support"
                    onClick={props.onNext}
                    target="_blank"
                    color="norm"
                    fullWidth
                    className="mb-2"
                >{c('Action').t`Invite members`}</ButtonLike>
            }
            {...props}
        />
    );
};

export default DuoAccountTourStep;
