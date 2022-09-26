import { useState } from 'react';

import { Button } from '@proton/components/components';

import Step from './Step';
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
            <Stepper activeStep={activeStep}>
                {steps.map((step) => (
                    <Step key={step}>{step}</Step>
                ))}
            </Stepper>

            <div className="mt3 flex flex-justify-end">
                <Button
                    className="mr0-5"
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
