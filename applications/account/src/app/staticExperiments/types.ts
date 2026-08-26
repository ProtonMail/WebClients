import type { staticExperimentsConfig } from './config';

interface StaticExperimentScheduleEntry {
    startsAt: string;
    endsAt?: string;
    weights: Record<string, number>;
}

export interface StaticExperimentConfig {
    enabled: boolean;
    schedule: [StaticExperimentScheduleEntry, ...StaticExperimentScheduleEntry[]];
}

export type StaticExperimentsState = Record<string, string>;

export type StaticExperimentName = keyof typeof staticExperimentsConfig;

export type StaticExperimentVariant<Name extends StaticExperimentName> =
    (keyof (typeof staticExperimentsConfig)[Name]['schedule'][number]['weights'] & string) | 'disabled';
