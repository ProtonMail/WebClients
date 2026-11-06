import { selectStep } from './forgotPasswordStepRegistry';
import { ForgotPasswordContext } from './wizard/ForgotPasswordContext';
import type { ForgotPasswordStepProps } from './wizard/forgotPasswordStep';

/** The step for the machine's state. */
export const UnauthedForgotPasswordWizard = ({ onBack }: ForgotPasswordStepProps) => {
    const Step = ForgotPasswordContext.useSelector(selectStep);
    return Step ? <Step onBack={onBack} /> : null;
};
