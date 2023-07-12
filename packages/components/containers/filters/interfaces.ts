import { Annotation } from 'codemirror/addon/lint/lint';

export enum FilterStatement {
    ALL = 'all',
    ANY = 'any',
}

export enum ConditionType {
    SELECT = 'select',
    SUBJECT = 'subject',
    SENDER = 'sender',
    RECIPIENT = 'recipient',
    ATTACHMENTS = 'attachments',
}

export enum ConditionComparator {
    CONTAINS = 'contains',
    IS = 'is',
    STARTS = 'starts',
    ENDS = 'ends',
    MATCHES = 'matches',
    IS_NOT = '!is',
    DOES_NOT_CONTAIN = '!contains',
    DOES_NOT_START = '!starts',
    DOES_NOT_END = '!ends',
    DOES_NOT_MATCH = '!matches',
}

export const ConditionComparatorMap = new Map<ConditionComparator, ConditionComparator>([
    [ConditionComparator.CONTAINS, ConditionComparator.DOES_NOT_CONTAIN],
    [ConditionComparator.ENDS, ConditionComparator.DOES_NOT_END],
    [ConditionComparator.MATCHES, ConditionComparator.DOES_NOT_MATCH],
    [ConditionComparator.STARTS, ConditionComparator.DOES_NOT_START],
    [ConditionComparator.IS, ConditionComparator.IS_NOT],
]);

//Map the opposite to it's positive comparator
export const ConditionComparatorInvertedMap = new Map<ConditionComparator, ConditionComparator>();
ConditionComparatorMap.forEach((value, key) => ConditionComparatorInvertedMap.set(value, key));

/* Simple Modal Filter Model interfaces */

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

/* Expected API Format */

export interface FilterOperator {
    label: string;
    value: FilterStatement;
}

export interface FilterActions {
    FileInto: string[];
    Mark: {
        Read: boolean;
        Starred: boolean;
    };
    Vacation?: string | null;
}

export interface FilterCondition {
    Comparator: {
        value: ConditionComparator;
        label: string;
    };
    Type: {
        value: ConditionType;
        label: string;
    };
    Values: string[];
}

export interface SimpleObject {
    Operator: FilterOperator;
    Conditions: FilterCondition[];
    Actions: FilterActions;
}

export interface Filter {
    ID: string;
    Name: string;
    Status: number;
    Priority?: number;
    Version: 1 | 2;
    Simple?: SimpleObject;
    Sieve?: string;
    Tree?: any;
}
