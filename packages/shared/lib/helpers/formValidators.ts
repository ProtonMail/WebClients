import { c } from 'ttag';
import { validateEmailAddress } from './email';
import { isNumber } from './validators';

export const requiredValidator = (value: any) =>
    value === undefined || value === null || value?.trim?.() === '' ? c('Error').t`This field is required` : '';
export const emailValidator = (value: string) => (!validateEmailAddress(value) ? c('Error').t`Email is not valid` : '');
export const numberValidator = (value: string) => (!isNumber(value) ? c('Error').t`Not a valid number` : '');
export const confirmPasswordValidator = (a: string, b: string) => (a !== b ? c('Error').t`Passwords do not match` : '');
