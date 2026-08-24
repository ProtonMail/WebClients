import { c } from 'ttag';

import { getApiErrorMessage } from '../api/helpers/apiErrorHelper';

export const getNonEmptyErrorMessage = (error: any, customMessage?: string) => {
    return getApiErrorMessage(error) || error?.message || customMessage || c('Error').t`Unknown error`;
};
