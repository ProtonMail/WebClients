import { createContext } from 'react';

export interface StepperContextContextValue {
    activeStep: number;
}

const StepperContext = createContext({} as StepperContextContextValue);

export default StepperContext;
