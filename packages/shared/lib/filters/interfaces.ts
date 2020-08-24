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
}

export interface SimpleFilterModalModel {
    id?: string;
    status?: number;
    version?: 1 | 2;
    step: Step;
    name: string;
    statement: FilterStatement;
    actions: Actions;
    conditions: Condition[];
}

/* Advanced (Sieve) Modal filter model interfaces */

export enum StepSieve {
    NAME,
    SIEVE,
}

export interface SieveIssue {
    message: string;
    severity: string;
}

export interface ErrorsSieve {
    name: string;
    sieve: string;
}

export interface AdvancedSimpleFilterModalModel {
    id?: string;
    status?: number;
    version?: 1 | 2;
    step: StepSieve;
    name: string;
    sieve: string;
    issues: SieveIssue[];
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
    Vacation: string | null;
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

export interface Filter {
    ID: string;
    Name: string;
    Status: number;
    Priority?: number;
    Version: 1 | 2;
    Simple?: {
        Operator: FilterOperator;
        Conditions: FilterCondition[];
        Actions: FilterActions;
    };
    Sieve?: string;
    Tree?: any;
}
