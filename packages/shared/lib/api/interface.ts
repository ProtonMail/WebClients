export interface PaginationParams {
    Page?: number;
    PageSize?: number;
}

export interface CountParams {
    AddressID?: string;
    OnlyInInboxForCategories: 1 | 0 | undefined;
}
