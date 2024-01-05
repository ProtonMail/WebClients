import { c } from 'ttag';

import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

export const getNonEmptyErrorMessage = (error: any, customMessage?: string) => {
    return getApiErrorMessage(error) || error?.message || customMessage || c('Error').t`Unknown error`;
};
