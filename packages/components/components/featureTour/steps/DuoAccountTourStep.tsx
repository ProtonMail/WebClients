import { c } from 'ttag';

import { organizationThunk } from '@proton/account/organization';
import { userThunk } from '@proton/account/user';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import duoPlanBackground from '@proton/styles/assets/img/onboarding/duoPlan.svg';

import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayDuoAccountTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
    return {
        canDisplay: user.isAdmin && organization.PlanName === PLANS.DUO && organization.UsedMembers <= 1,
        preloadUrls: [duoPlanBackground],
    };
};

const DuoAccountTourStep = (props: FeatureTourStepProps) => {
    const protonDuoPlanName = PLAN_NAMES[PLANS.DUO];

    return (
        <FeatureTourStepsContent
            bullets={props.bullets}
            title={c('Title').t`Set up ${protonDuoPlanName}`}
            illustration={duoPlanBackground}
            illustrationSize="medium"
            mainCTA={
                <ButtonLike
                    as={SettingsLink}
                    path="/multi-user-support"
                    onClick={props.onNext}
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
            <p className="m-0">
                {c('Info')
                    .t`Invite your partner, a friend, or whoever you're sharing your ${protonDuoPlanName} plan with.`}
            </p>
        </FeatureTourStepsContent>
    );
};

export default DuoAccountTourStep;
