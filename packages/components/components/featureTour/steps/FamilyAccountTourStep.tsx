import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { userThunk } from '@proton/account/user';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { PLANS } from '@proton/payments';
import familyPlanBackground from '@proton/styles/assets/img/onboarding/familyPlan.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayFamilyAccountTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
    return {
        canDisplay: user.isAdmin && organization.PlanName === PLANS.FAMILY && organization.UsedMembers <= 1,
        preloadUrls: [familyPlanBackground],
    };
};

const FamilyAccountTourStep = (props: FeatureTourStepProps) => {
    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            title={c('Title').t`Set up your family account`}
            illustration={familyPlanBackground}
            illustrationSize="medium"
            mainCTA={
                <ButtonLike
                    as={SettingsLink}
                    onClick={props.onNext}
                    path="/multi-user-support"
                    target="_blank"
                    color="norm"
                    fullWidth
                >{c('Action').t`Invite members`}</ButtonLike>
            }
            extraCTA={
                <FeatureTourStepCTA type="secondary" onClick={props.onNext}>
                    {c('Button').t`Maybe later`}
                </FeatureTourStepCTA>
            }
        >
            <p className="m-0">{c('Info').t`Invite family members and get everything up and running.`}</p>
        </FeatureTourStepsContent>
    );
};

export default FamilyAccountTourStep;
