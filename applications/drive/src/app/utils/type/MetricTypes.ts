// TODO: DRVWEB-4123 Unify Share Types
export enum MetricShareType {
    Own = 'own',
    Device = 'device',
    Photo = 'photo',
    Shared = 'shared',
}

enum BaseErrorCategory {
    NetworkError = 'network_error',
    ServerError = 'server_error',
    Unknown = 'unknown',
    RateLimited = 'rate_limited',
    HTTPClientError = '4xx',
    HTTPServerError = '5xx',
}

enum UploadSpecificErrorCategory {
    FreeSpaceExceeded = 'free_space_exceeded',
    TooManyChildren = 'too_many_children',
    IntegrityError = 'integrity_error',
}

enum DownloadSpecificErrorCategory {
    DecryptionError = 'decryption_error',
}

export type UploadErrorCategoryType = UploadSpecificErrorCategory | BaseErrorCategory;
export type DownloadErrorCategoryType = DownloadSpecificErrorCategory | BaseErrorCategory;

export const UploadErrorCategory = { ...UploadSpecificErrorCategory, ...BaseErrorCategory };
export const DownloadErrorCategory = { ...DownloadSpecificErrorCategory, ...BaseErrorCategory };
