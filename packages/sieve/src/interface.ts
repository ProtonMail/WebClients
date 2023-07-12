import { ConditionComparator, FilterStatement } from '@proton/components/containers/filters/interfaces';

export type SIEVE_VERSION = 1 | 2;

export interface ValueTypePair {
    Type: string;
    Value: string;
}
export interface ValueNamePair {
    Name: string;
    Value: string;
}
export interface ValueTextPair {
    Text: string;
    Value: string;
}

export interface PrepareType {
    Type: string;
    Headers: string;
}

export interface Match {
    Type: string;
}

export const LABEL_KEYS = {
    all: 'All',
    any: 'Any',
    subject: 'Subject',
    sender: 'Sender',
    recipient: 'Recipient',
    attachments: 'Attachments',
    contains: 'contains',
    '!contains': 'does not contain',
    is: 'is exactly',
    '!is': 'is not',
    matches: 'matches',
    '!matches': 'does not match',
    starts: 'begins with',
    '!starts': 'does not begin with',
    ends: 'ends with',
    '!ends': 'does not end with',
};

export type LABEL_KEY_TYPE = keyof typeof LABEL_KEYS;

export const LABEL_KEY_MATCHING = [
    {
        match: 'Contains',
        default: 'contains',
        negate: '!contains',
    },
    {
        match: 'Is',
        default: 'is',
        negate: '!is',
    },
    {
        match: 'Matches',
        default: 'matches',
        negate: '!matches',
    },
    {
        match: 'Starts',
        default: 'starts',
        negate: '!starts',
    },
    { match: 'Ends', default: 'ends', negate: '!ends' },
];

export const MATCH_KEYS: Partial<Record<ConditionComparator | 'default', string>> = {
    is: 'Is',
    contains: 'Contains',
    matches: 'Matches',
    starts: 'Starts',
    ends: 'Ends',
    default: 'Defaults',
};

export const OPERATOR_KEYS: Record<FilterStatement, string> = {
    all: 'AllOf',
    any: 'AnyOf',
};

export interface BuildFileIntoType {
    Type: string;
    Name: string | ValueTypePair;
}

export interface IfTest {
    Headers: string[];
    Keys: string[];
    Match: Match;
    Format: Match;
    Type: string;
    Test: IfTest;
    DateFormat?: string;
    Zone?: {
        Argument: string;
        Type: string;
    };
    MatchOperator?: {
        Comparator: string;
        Type: string;
    };
    AddressPart?: Match;
}

export interface ItType {
    If: {
        Tests: IfTest[];
        Type: string;
    };
    Then: {
        Type: string;
        Name: string;
        Flags: string[];
        Message: string;
        Args: any[];
    }[];
    Type: string;
}

export interface SieveTests {
    Headers?: string[];
    Test?: {};
    Type: string;
}

export interface SieveCondition {
    tests: SieveTests[];
    comparators: string[];
    dollarNeeded: boolean;
}

export type EscapeVariableType = string | ValueTypePair;

export interface MainNodeType {
    List?: string[];
    Type?: string;
    Name?: string;
    Value?: string;
    Flags?: never[];
    Text?: string;
    Then?: any[];
    If?: {
        Tests: any;
        Type: string;
    };
}
