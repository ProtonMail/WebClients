import CustomStep from '../defaultCustomStep/CustomStep';
import type { SignupCustomStepProps } from '../interface';

export const getCustomStep = ({ hasExploreStep }: { hasExploreStep: boolean }) => {
    return function CustomStepClosure(props: SignupCustomStepProps) {
        return <CustomStep {...props} hasExploreStep={hasExploreStep} />;
    };
};
