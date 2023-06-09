import { c } from 'ttag';

import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

export const getErrorMessage = (error: any, fallback?: string) =>
    getApiErrorMessage(error) ?? error?.message ?? fallback ?? c('Error').t`Unknown error`;
