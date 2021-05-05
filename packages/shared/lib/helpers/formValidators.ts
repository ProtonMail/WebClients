import { c, msgid } from 'ttag';
import { validateEmailAddress } from './email';
import { isNumber } from './validators';

export const requiredValidator = (value: any) =>
    value === undefined || value === null || value?.trim?.() === '' ? c('Error').t`This field is required` : '';
export const minLengthValidator = (value: string, minimumLength: number) =>
    value.length < minimumLength ? c('Error').t`This field requires a minimum of ${minimumLength} characters.` : '';
export const emailValidator = (value: string) => (!validateEmailAddress(value) ? c('Error').t`Email is not valid` : '');
export const numberValidator = (value: string) => (!isNumber(value) ? c('Error').t`Not a valid number` : '');
export const confirmPasswordValidator = (a: string, b: string) => (a !== b ? c('Error').t`Passwords do not match` : '');
export const defaultMinPasswordLength = 8;
export const getMinPasswordLengthMessage = (length = defaultMinPasswordLength) =>
    c('Validation').ngettext(
        msgid`Password must contain at least ${length} character`,
        `Password must contain at least ${length} characters`,
        length
    );
export const passwordLengthValidator = (a: string, length = defaultMinPasswordLength) =>
    a.length < length ? getMinPasswordLengthMessage() : '';
