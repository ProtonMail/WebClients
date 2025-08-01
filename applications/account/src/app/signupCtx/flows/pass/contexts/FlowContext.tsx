import { type FC, type PropsWithChildren, createContext, useContext, useState } from 'react';

import type { Maybe } from '@proton/pass/types';

export enum Step {
    Signup = 'signup',
    RecoveryKit = 'recovery-kit',
    UpgradePlan = 'upgrade-plan',
    Payment = 'payment',
    InstallExtension = 'install-extension',
}

type FlowContextType = { step: Step; setStep: <T extends Step>(step: T) => void };

const FlowContext = createContext<Maybe<FlowContextType>>(undefined);

export const FlowProvider: FC<PropsWithChildren> = ({ children }) => {
    const [step, setStep] = useState<Step>(Step.UpgradePlan);

    return <FlowContext.Provider value={{ step, setStep }}>{children}</FlowContext.Provider>;
};

export const useFlow = () => {
    const context = useContext(FlowContext);
    if (!context) throw new Error('useFlow must be used within a FlowProvider');
    return context;
};
