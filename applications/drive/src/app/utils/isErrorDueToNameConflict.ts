import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';

export const isErrorDueToNameConflict = (err: any): boolean =>
    typeof err === 'object' &&
    err.status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY &&
    err.data?.Code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS;
