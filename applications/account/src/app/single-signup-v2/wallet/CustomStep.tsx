import type { SignupCustomStepProps } from '../interface';
import MailCustomStep from '../mail/CustomStep';

const CustomStep = (props: SignupCustomStepProps) => {
    return <MailCustomStep {...props} hasRecoveryStepConfirmWarning={false} />;
};

export default CustomStep;
