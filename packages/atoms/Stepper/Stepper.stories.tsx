import { useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { RadioGroup } from '@proton/components';

import Step from './Step';
import type { StepperProps } from './Stepper';
import Stepper from './Stepper';
import mdx from './Stepper.mdx';

export default {
    component: Stepper,
    subcomponents: { Step },
    title: 'components/Stepper',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => {
    const [activeStep, setActiveStep] = useState(0);

    const steps = ['Item 1', 'Item 2 with super long label. I should wrap.', 'Item 3', 'Item 4'];

    return (
        <>
            <Stepper position="center" activeStep={activeStep}>
                {steps.map((step) => (
                    <Step key={step}>{step}</Step>
                ))}
            </Stepper>

            <div className="mt-11 flex justify-end">
                <Button
                    className="mr-2"
                    color="norm"
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((step) => step - 1)}
                >
                    Previous
                </Button>
                <Button
                    color="norm"
                    disabled={activeStep === steps.length - 1}
                    onClick={() => setActiveStep((step) => step + 1)}
                >
                    Next
                </Button>
            </div>
        </>
    );
};

const positionVariants: Required<StepperProps>['position'][] = ['start', 'center', 'end'];

export const Centered = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [position, setPosition] = useState<Required<StepperProps>['position']>('start');

    const steps = ['Item 1', 'Item 2.', 'Item 3', 'Item 4'];

    return (
        <>
            <div className="mb-8">
                <strong className="block mb-4">Position</strong>
                <RadioGroup
                    name="selected-variant"
                    onChange={setPosition}
                    value={position}
                    options={positionVariants.map((variant) => ({ value: variant, label: variant }))}
                />
            </div>

            <Stepper position={position} activeStep={activeStep}>
                {steps.map((step) => (
                    <Step key={step}>{step}</Step>
                ))}
            </Stepper>

            <div className="mt-11 flex justify-end">
                <Button
                    className="mr-2"
                    color="norm"
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep((step) => step - 1)}
                >
                    Previous
                </Button>
                <Button
                    color="norm"
                    disabled={activeStep === steps.length - 1}
                    onClick={() => setActiveStep((step) => step + 1)}
                >
                    Next
                </Button>
            </div>
        </>
    );
};
