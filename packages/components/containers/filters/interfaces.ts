import type { Annotation } from 'codemirror/addon/lint/lint';

import type { ConditionComparator, ConditionType, FilterStatement } from '@proton/sieve/filterModel';

export enum Step {
    NAME,
    CONDITIONS,
    ACTIONS,
    PREVIEW,
}

export interface Errors {
    name: string;
    actions: string;
    conditions: string;
}

export interface Actions {
    labelAs: {
        labels: string[];
        isOpen: boolean;
    };
    moveTo: {
        folder?: string;
        isOpen: boolean;
    };
    markAs: {
        read: boolean;
        starred: boolean;
        isOpen: boolean;
    };
    autoReply: string | null;
    error?: string;
}

export interface Condition {
    type: ConditionType;
    comparator: ConditionComparator;
    values?: string[];
    error?: string;
    isOpen: boolean;
    id: string;
    defaultValue?: string;
}

export interface FilterModalModelBase {
    id?: string;
    status?: number;
    version?: 1 | 2;
    name: string;
}

export interface SimpleFilterModalModel extends FilterModalModelBase {
    step: Step;
    statement: FilterStatement;
    actions: Actions;
    conditions: Condition[];
    apply: boolean;
}

export interface ErrorsSieve {
    name: string;
    sieve: string;
}

export interface AdvancedSimpleFilterModalModel extends FilterModalModelBase {
    sieve: string;
    issues: Annotation[];
}
