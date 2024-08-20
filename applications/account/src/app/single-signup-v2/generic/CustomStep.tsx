import type { SignupCustomStepProps } from '../interface';
import MailCustomStep from '../mail/CustomStep';

const CustomStep = (props: SignupCustomStepProps) => {
    return <MailCustomStep {...props} hasExploreStep={true} />;
};

export default CustomStep;
