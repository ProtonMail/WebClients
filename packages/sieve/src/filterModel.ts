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

export interface FilterOperator {
    label: string;
    value: FilterStatement;
}

export interface FilterRedirect {
    Address: string;
    Copy?: boolean;
}

export interface FilterActions {
    FileInto: string[];
    Mark: {
        Read: boolean;
        Starred: boolean;
    };
    Vacation?: string | null;
    Redirects?: FilterRedirect[];
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
    Priority: number;
    Version: 1 | 2;
    Simple?: SimpleObject;
    Sieve?: string;
    Tree?: any;
}

export type CreateFilter = Omit<Filter, 'Priority'>;
