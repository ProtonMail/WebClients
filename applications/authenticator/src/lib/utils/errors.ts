import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

export const withErrorDetails = (text: string) => (error: unknown) =>
    text + (getApiErrorMessage(error)?.replace(/^(.*)$/, ' ($1)') ?? '');
