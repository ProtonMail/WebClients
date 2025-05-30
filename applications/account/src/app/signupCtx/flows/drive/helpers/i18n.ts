import { c } from 'ttag';

export const getSecureStorageString = (value = '') => c('Signup').t`${value} of secure storage`;

export const getSecureStoragePerUserString = (value = '') => c('Signup').t`${value} of secure storage per user`;

export const getSavePercentageString = (percentage: number) => c('Signup').t`Save ${percentage}%`;
