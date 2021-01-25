import { Annotation } from 'codemirror';
import { FilterModalModelBase } from 'proton-shared/lib/filters/interfaces';

export enum StepSieve {
    NAME,
    SIEVE,
}

export interface ErrorsSieve {
    name: string;
    sieve: string;
}

export interface AdvancedSimpleFilterModalModel extends FilterModalModelBase {
    step: StepSieve;
    sieve: string;
    issues: Annotation[];
}
