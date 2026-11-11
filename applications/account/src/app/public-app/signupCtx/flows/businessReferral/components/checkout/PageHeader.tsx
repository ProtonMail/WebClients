import { c } from 'ttag';

import type { BusinessSignupStep } from './StepIndicator';
import { StepIndicator } from './StepIndicator';

interface Props {
    currentStep: BusinessSignupStep;
    completedSteps?: BusinessSignupStep[];
}

export const PageHeader = ({ currentStep, completedSteps }: Props) => (
    <div
        className="flex flex-column items-center gap-4 pb-8 px-4 w-full md:w-custom mx-auto"
        style={{ '--md-w-custom': '60rem' }}
    >
        <h1
            className="color-norm font-arizona text-semibold text-5xl md:text-7xl text-center mt-0 mb-0 w-full md:w-custom"
            style={{ '--md-w-custom': '48rem' }}
        >
            {c('Signup').t`Encrypted solutions to protect`}
            <br />
            {c('Signup').t`your entire business`}
        </h1>

        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
    </div>
);
