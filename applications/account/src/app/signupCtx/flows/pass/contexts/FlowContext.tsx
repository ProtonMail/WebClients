import { type FC, type PropsWithChildren, createContext, useContext, useState } from 'react';

export enum Step {
    Signup = 'signup',
    RecoveryKit = 'recovery-kit',
    UpgradePlan = 'upgrade-plan',
}

type FlowContextType = { step: string; setStep: (step: Step) => void };

const FlowContext = createContext<FlowContextType | undefined>(undefined);

type FlowProviderProps = { initialStep?: Step };

export const FlowProvider: FC<PropsWithChildren<FlowProviderProps>> = ({ children, initialStep = Step.Signup }) => {
    const [step, setStep] = useState<Step>(initialStep);
    return <FlowContext.Provider value={{ step, setStep }}>{children}</FlowContext.Provider>;
};

export const useFlow = () => {
    const context = useContext(FlowContext);
    if (!context) throw new Error('useFlow must be used within a FlowProvider');
    return context;
};
