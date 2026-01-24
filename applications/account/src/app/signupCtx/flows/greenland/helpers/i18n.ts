import { c } from 'ttag';

export const getSavePercentageString = (percentage: number) => c('Signup').t`Save ${percentage}%`;

export const getSecureStorageString = (value = '') => c('Signup').t`${value} total storage`;
