import { c, msgid } from 'ttag';

import { MIN_PASSWORD_LENGTH } from '../constants';
import { validateEmailAddress } from './email';
import { REGEX_USERNAME, REGEX_USERNAME_END, REGEX_USERNAME_START, isNumber } from './validators';

export const requiredValidator = (value: any) =>
    value === undefined || value === null || value?.trim?.() === '' ? c('Error').t`This field is required` : '';

export const usernameCharacterValidator = (value: string) =>
    !REGEX_USERNAME.test(value) ? c('Error').t`Try using only letters, numerals, and _.-` : '';

export const usernameStartCharacterValidator = (value: string) =>
    !REGEX_USERNAME_START.test(value) ? c('Error').t`Username must begin with a letter or digit` : '';

export const usernameEndCharacterValidator = (value: string) =>
    !REGEX_USERNAME_END.test(value) ? c('Error').t`Username must end with a letter or digit` : '';

const defaultUsernameLength = 40;
export const usernameLengthValidator = (value: string, n = defaultUsernameLength) =>
    value.length > defaultUsernameLength
        ? c('Validation').ngettext(
              msgid`Try a shorter username (${n} character max)`,
              `Try a shorter username (${n} characters max)`,
              n
          )
        : '';

export const minLengthValidator = (value: string, minimumLength: number) =>
    value.length < minimumLength ? c('Error').t`This field requires a minimum of ${minimumLength} characters.` : '';

export const maxLengthValidator = (value: string, maximumLength: number) =>
    value.length > maximumLength ? c('Error').t`This field exceeds the maximum of ${maximumLength} characters.` : '';

export const emailValidator = (value: string) => (!validateEmailAddress(value) ? c('Error').t`Email is not valid` : '');

export const numberValidator = (value: string) => (!isNumber(value) ? c('Error').t`Not a valid number` : '');

export const confirmPasswordValidator = (a: string, b: string) => (a !== b ? c('Error').t`Passwords do not match` : '');

export const confirmEmailValidator = (a: string, b: string) =>
    a !== b ? c('Error').t`The email addresses do not match` : '';
export const usernameValidator = (a: string, b: string) => (a !== b ? c('Error').t`Incorrect username` : '');

export const getMinPasswordLengthMessage = () =>
    c('Validation').ngettext(
        msgid`Password must contain at least ${MIN_PASSWORD_LENGTH} character`,
        `Password must contain at least ${MIN_PASSWORD_LENGTH} characters`,
        MIN_PASSWORD_LENGTH
    );

export const passwordLengthValidator = (password: string) =>
    password.length < MIN_PASSWORD_LENGTH ? getMinPasswordLengthMessage() : '';
