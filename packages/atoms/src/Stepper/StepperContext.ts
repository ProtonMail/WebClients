import { createContext } from 'react';

export interface StepperContextContextValue {
    activeStep: number;
}

export const StepperContext = createContext({} as StepperContextContextValue);
