export interface Filter {
    [key: string]: number;
}

export interface Sort {
    sort: 'Time' | 'Size' | 'SnoozeTime';
    desc: boolean;
}

export interface SearchParameters {
    address?: string;
    from?: string;
    to?: string;
    keyword?: string;
    begin?: number;
    end?: number;
    wildcard?: number;
}
