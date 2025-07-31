import { type FC, type PropsWithChildren, createContext, useContext, useState } from 'react';

import { Maybe } from '@proton/pass/types';
import { PLANS } from '@proton/payments/core/constants';

export enum Step {
    Signup = 'signup',
    RecoveryKit = 'recovery-kit',
    UpgradePlan = 'upgrade-plan',
    Payment = 'payment',
    InstallExtension = 'install-extension',
}

type StepState =
    | { step: Step.Signup }
    | { step: Step.RecoveryKit }
    | { step: Step.UpgradePlan }
    | { step: Step.Payment; data: { plan: PLANS } }
    | { step: Step.InstallExtension };

type FlowContextType = StepState & {
    setStep: <T extends Step>(
        step: T,
        data?: Extract<StepState, { step: T }> extends { data: infer D } ? D : undefined
    ) => void;
};

const FlowContext = createContext<Maybe<FlowContextType>>(undefined);

export const FlowProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<StepState>({ step: Step.UpgradePlan });

    const setStep = <T extends Step>(
        step: T,
        data?: Extract<StepState, { step: T }> extends { data: infer D } ? D : undefined
    ) => setState({ step, data } as StepState);

    return <FlowContext.Provider value={{ ...state, setStep }}>{children}</FlowContext.Provider>;
};

export const useFlow = () => {
    const context = useContext(FlowContext);
    if (!context) throw new Error('useFlow must be used within a FlowProvider');
    return context;
};
