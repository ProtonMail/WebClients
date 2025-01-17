import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { userThunk } from '@proton/account/user';
import { ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { PLANS } from '@proton/payments';
import familyPlanBackground from '@proton/styles/assets/img/onboarding/familyPlan.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayFamilyAccountTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
    return user.isAdmin && organization.PlanName === PLANS.FAMILY && organization.UsedMembers <= 1;
};

const FamilyAccountTourStep = (props: FeatureTourStepProps) => {
    return (
        <FeatureTourStepsContent
            title={c('Title').t`Set up your family account`}
            description={c('Info').t`Invite family members and get everything up and running.`}
            illustration={familyPlanBackground}
            illustrationSize="medium"
            descriptionClassName="mb-16"
            primaryButton={
                <ButtonLike
                    as={SettingsLink}
                    onClick={props.onNext}
                    path="/multi-user-support"
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

export default FamilyAccountTourStep;
