import { FormType } from '@proton/pass/fathom';
import type { AutosaveFormEntry, FormCredentials, FormEntry } from '@proton/pass/types';
import { AutosaveMode, FormEntryStatus } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { isFormEntryCommitted, isFormEntryPromptable, setFormEntryStatus, validateFormCredentials } from './form-entry';

const getMockCredentials = (userIdentifier: string = '', password: string = ''): FormCredentials => ({
    userIdentifier,
    password,
});
const getMockFormSubmission = (status: FormEntryStatus, type: FormType, data?: FormCredentials): FormEntry => ({
    data: data ?? getMockCredentials('john@proton.me', '123'),
    domain: 'proton.me',
    formId: uniqueId(),
    port: null,
    protocol: 'https',
    status,
    submit: false,
    submittedAt: -1,
    type,
    updatedAt: -1,
});

describe('Form entry utils', () => {
    describe('setFormEntryStatus', () => {
        test('should update an entries status', () => {
            const submission = getMockFormSubmission(FormEntryStatus.STAGING, FormType.LOGIN);
            expect(setFormEntryStatus(submission, FormEntryStatus.COMMITTED)).toEqual({
                ...submission,
                status: FormEntryStatus.COMMITTED,
            });
        });
    });

    describe('isFormEntryCommitted', () => {
        test('should return true if form entry status is `COMMITTED`', () => {
            const submission = getMockFormSubmission(FormEntryStatus.COMMITTED, FormType.LOGIN);
            expect(isFormEntryCommitted(submission)).toBe(true);
        });

        test('should return false if form entry status is not `COMMITTED`', () => {
            const submission = getMockFormSubmission(FormEntryStatus.STAGING, FormType.LOGIN);
            expect(isFormEntryCommitted(submission)).toBe(false);
        });
    });

    describe('isFormEntryPromptable', () => {
        test('should return false if form entry status is not `COMMITTED`', () => {
            const submission: AutosaveFormEntry = {
                ...getMockFormSubmission(FormEntryStatus.STAGING, FormType.LOGIN),
                autosave: { shouldPrompt: false },
            };

            expect(isFormEntryPromptable(submission)).toBe(false);
        });

        test('should return false if form entry status is `COMMITTED` but not promptable', () => {
            const submission: AutosaveFormEntry = {
                ...getMockFormSubmission(FormEntryStatus.COMMITTED, FormType.LOGIN),
                autosave: { shouldPrompt: false },
            };

            expect(isFormEntryPromptable(submission)).toBe(false);
        });

        test('should return true if form entry status is `COMMITTED` and promptable', () => {
            const submission: AutosaveFormEntry = {
                ...getMockFormSubmission(FormEntryStatus.COMMITTED, FormType.LOGIN),
                autosave: { shouldPrompt: true, data: { type: AutosaveMode.NEW } },
            };

            expect(isFormEntryPromptable(submission)).toBe(true);
        });
    });

    describe('validateFormCredentials', () => {
        [FormType.LOGIN, FormType.REGISTER].forEach((type) => {
            describe(`${type}`, () => {
                test('should return true if username AND password are non-empty', () => {
                    const credentials = getMockCredentials('john@proton.me', '123');
                    const options = { type, partial: false };
                    expect(validateFormCredentials(credentials, options)).toBe(true);
                });

                test('should return false if password is empty', () => {
                    const credsNoPassword = getMockCredentials('john@proton.me', '');
                    const credsInvalid = getMockCredentials('', ' ');
                    const options = { type, partial: false };

                    expect(validateFormCredentials(credsNoPassword, options)).toBe(false);
                    expect(validateFormCredentials(credsInvalid, options)).toBe(false);
                });

                test('should return true if username OR password are non-empty if partial: true', () => {
                    const credsNoPassword = getMockCredentials('john@proton.me', '');
                    const credsNoUsername = getMockCredentials('', '123');
                    const options = { type, partial: true };

                    expect(validateFormCredentials(credsNoUsername, options)).toBe(true);
                    expect(validateFormCredentials(credsNoPassword, options)).toBe(true);
                });
            });
        });

        [FormType.PASSWORD_CHANGE, FormType.NOOP].forEach((type) => {
            describe(`${type}`, () => {
                test('should return true if password is non-empty', () => {
                    const credentials = getMockCredentials('', '123');
                    expect(validateFormCredentials(credentials, { type, partial: true })).toBe(true);
                    expect(validateFormCredentials(credentials, { type, partial: false })).toBe(true);
                });

                test('should return false if password is empty', () => {
                    const emptyPw = getMockCredentials('', '');
                    const invalidPw = getMockCredentials('', ' ');
                    expect(validateFormCredentials(emptyPw, { type, partial: true })).toBe(false);
                    expect(validateFormCredentials(invalidPw, { type, partial: false })).toBe(false);
                });
            });
        });

        [FormType.RECOVERY].forEach((type) => {
            describe(`${type}`, () => {
                test('should return false', () => {
                    const options = { type: FormType.RECOVERY, partial: true };
                    expect(validateFormCredentials(getMockCredentials(), options)).toBe(false);
                });
            });
        });
    });
});
