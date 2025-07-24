import { type FC, type PropsWithChildren, createContext, useContext, useState } from 'react';

import { Maybe } from '@proton/pass/types';

export enum Step {
    Signup = 'signup',
    RecoveryKit = 'recovery-kit',
    UpgradePlan = 'upgrade-plan',
}

type FlowContextType = { step: string; setStep: (step: Step) => void };

const FlowContext = createContext<Maybe<FlowContextType>>(undefined);

export const FlowProvider: FC<PropsWithChildren> = ({ children }) => {
    const [step, setStep] = useState<Step>(Step.Signup);

    return <FlowContext.Provider value={{ step, setStep }}>{children}</FlowContext.Provider>;
};

export const useFlow = () => {
    const context = useContext(FlowContext);
    if (!context) throw new Error('useFlow must be used within a FlowProvider');
    return context;
};
