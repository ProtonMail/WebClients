export interface Filter {
    [key: string]: number;
}

export interface Sort {
    sort: 'Time' | 'Size';
    desc: boolean;
}

export interface Page {
    page: number;
    total: number;
    size: number;
}

export interface SearchParameters {
    address?: string;
    from?: string;
    to?: string;
    keyword?: string;
    begin?: number;
    end?: number;
    attachments?: number;
    wildcard?: number;
}
