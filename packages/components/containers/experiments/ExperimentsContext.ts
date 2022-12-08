import { createContext } from 'react';

export interface Experiment {
    Value: string;
    Name: ExperimentCode;
}

export enum ExperimentCode {
    Family2023 = 'Family2023',
    ReferralProgramSignup = 'ReferralProgramSignup',
    GmailSyncOnboarding = 'GmailSyncOnboarding',
    MultipleUpsell = 'MultipleUpsell',
}

export interface ExperimentsContextValue {
    experiments: { [code in ExperimentCode]?: string | undefined };
    loading: boolean | undefined;
    initialize: () => Promise<void>;
}

export default createContext<ExperimentsContextValue>({} as ExperimentsContextValue);
