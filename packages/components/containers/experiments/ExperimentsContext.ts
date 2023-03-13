import { createContext } from 'react';

export interface Experiment {
    Value: string;
    Name: ExperimentCode;
}

export enum ExperimentCode {
    ReferralProgramSignup = 'ReferralProgramSignup',
    ExternalSignupGeneric = 'ExternalSignupGeneric',
    ExternalSignupDrive = 'ExternalSignupDrive',
}

export interface ExperimentsContextValue {
    experiments: { [code in ExperimentCode]?: string | undefined };
    loading: boolean | undefined;
    initialize: () => Promise<void>;
}

export default createContext<ExperimentsContextValue>({} as ExperimentsContextValue);
