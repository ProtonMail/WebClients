export enum MetricShareType {
    Main = 'main',
    Device = 'device',
    Photo = 'photo',
    Shared = 'shared',
    SharedPhoto = 'shared_photo',
}

export enum MetricSharePublicType {
    SharedPublic = 'shared_public',
}

export type MetricShareTypeWithPublic = MetricSharePublicType | MetricShareType;
export enum MetricUserPlan {
    Paid = 'paid',
    Free = 'free',
    Anonymous = 'anonymous',
    Unknown = 'unknown',
}

enum BaseErrorCategory {
    NetworkError = 'network_error',
    ServerError = 'server_error',
    Unknown = 'unknown',
    RateLimited = 'rate_limited',
    HTTPClientError = '4xx',
    HTTPServerError = '5xx',
}

enum DownloadSpecificErrorCategory {
    DecryptionError = 'decryption_error',
}

export type DownloadErrorCategoryType = DownloadSpecificErrorCategory | BaseErrorCategory;

export const DownloadErrorCategory = { ...DownloadSpecificErrorCategory, ...BaseErrorCategory };
