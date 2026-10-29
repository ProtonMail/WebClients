import { c } from 'ttag';

import { allSubscriptionsThunk } from '@proton/account/allSubscriptions';
import { organizationThunk } from '@proton/account/organization';
import { userThunk } from '@proton/account/user';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { PLANS } from '@proton/payments/core/constants';
import { hasSubscriptionWithPlan } from '@proton/shared/lib/payments/plan/helpers';
import familyPlanBackground from '@proton/styles/assets/img/onboarding/familyPlan.svg';

import SettingsLink from '../../link/SettingsLink';
import type { FeatureTourStepProps, ShouldDisplayTourStep } from '../interface';
import FeatureTourStepCTA from './components/FeatureTourStepCTA';
import FeatureTourStepsContent from './components/FeatureTourStepsContent';

export const shouldDisplayFamilyAccountTourStep: ShouldDisplayTourStep = async (dispatch) => {
    const [user, organization, subscriptions] = await Promise.all([
        dispatch(userThunk()),
        dispatch(organizationThunk()),
        dispatch(allSubscriptionsThunk()),
    ]);
    return {
        canDisplay:
            user.isAdmin && hasSubscriptionWithPlan(subscriptions, [PLANS.FAMILY]) && organization.UsedMembers <= 1,
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
