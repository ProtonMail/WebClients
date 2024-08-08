export type ListType = 'open' | 'resolved';

export enum BREACH_STATE {
    UNREAD = 1,
    READ,
    RESOLVED,
}

export interface FetchedBreaches {
    id: string;
    name: string;
    email: string;
    severity: number;
    createdAt: string;
    publishedAt: string;
    size: number;
    passwordLastChars: string | null;
    exposedData: {
        code: string;
        name: string;
        values?: string[];
    }[];
    actions:
        | {
              code: string;
              name: string;
              desc: string;
              urls?: string[];
          }[]
        | null;
    source: {
        isAggregated: boolean;
        domain: string | null;
        category: null | {
            code: string;
            name: string;
        };
        country: null | {
            code: string;
            name: string;
            emoji: string;
        };
    };
    resolvedState: number;
}

export interface SampleBreach {
    id: string;
    name: string;
    email: string;
    severity: string;
    createdAt: string;
    resolvedState: number;
    source: {
        isAggregated: boolean;
        domain: string | null;
        category: null | {
            code: string;
            name: string;
        };
        country: null | {
            code: string;
            name: string;
            emoji: string;
        };
    };
}
