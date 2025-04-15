import MailCustomStep from '../defaultCustomStep/CustomStep';
import type { SignupCustomStepProps } from '../interface';

const CustomStep = (props: SignupCustomStepProps) => {
    return <MailCustomStep {...props} hasExploreStep={true} />;
};

export default CustomStep;
