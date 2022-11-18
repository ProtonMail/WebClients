import { BASE_SIZE, GIGA } from '@proton/shared/lib/constants';

import { getSampleCSV, parseMultiUserCsv } from './csv';
import { CSV_CONVERSION_ERROR_TYPE } from './errors/CsvConversionError';
import { ExportedCSVUser } from './types';

describe('multi user upload csv.ts', () => {
    const defaultFileName = 'filename';
    const getFile = (fileContent: string, filename: string = defaultFileName) => {
        const blob = new Blob([fileContent]);
        return new File([blob], filename);
    };
    const defaultUser: ExportedCSVUser = {
        DisplayName: 'Alice',
        EmailAddresses: 'alice@mydomain.com',
        Password: 'alice_password',
        TotalStorage: GIGA,
        VPNAccess: 1,
        PrivateSubUser: 0,
    };

    const defaultCsvFields = `DisplayName,EmailAddresses,Password,TotalStorage,VPNAccess,PrivateSubUser`;

    describe('parseMultiUserCsv', () => {
        describe('errors', () => {
            it('throws error if no files are passed', async () => {
                await expect(parseMultiUserCsv([])).rejects.toThrow(
                    'An error occurred uploading your file. No file has been selected.'
                );
            });

            it('throws error if file is empty', async () => {
                const filename = 'filename';
                const file = new File([], filename);
                await expect(parseMultiUserCsv([file])).rejects.toThrow('Your file "filename" is empty.');
            });

            it('throws error if file is > 10MB', async () => {
                const file = getFile(getSampleCSV([defaultUser]));
                /**
                 * Mock large file size
                 */
                Object.defineProperty(file, 'size', { value: 10 * BASE_SIZE ** 2 + 1 });

                await expect(parseMultiUserCsv([file])).rejects.toThrow(
                    'An error occurred uploading your file "filename". Maximum file size is 10 MB.'
                );
            });

            it('does not throw error if file is <= 10MB', async () => {
                const file = getFile(getSampleCSV([defaultUser]));
                /**
                 * Mock ok file size
                 */
                Object.defineProperty(file, 'size', { value: 10 * BASE_SIZE ** 2 });

                await expect(parseMultiUserCsv([file])).resolves.not.toThrow(
                    'An error occurred uploading your file "filename". Maximum file size is 10 MB.'
                );
            });

            it('throws error if there are > 500 rows', async () => {
                const rows = Array.from({ length: 501 }, () => defaultUser);
                const file = getFile(getSampleCSV(rows));

                await expect(parseMultiUserCsv([file])).rejects.toThrowError(
                    'Upload a CSV file with 500 user accounts or less.'
                );
            });

            it('does not throw error if there are <= 500 rows', async () => {
                const rows = Array.from({ length: 500 }, () => defaultUser);
                const file = getFile(getSampleCSV(rows));

                await expect(parseMultiUserCsv([file])).resolves.not.toThrowError(
                    'Upload a CSV file with 500 user accounts or less.'
                );
            });

            it('throws error if the EmailAddress field is not defined', async () => {
                const fileContent = ['Password', 'alice_password'].join('\n');
                const file = getFile(fileContent);

                await expect(parseMultiUserCsv([file])).rejects.toThrowError(
                    `It looks like your file is missing the 'EmailAddresses' header.`
                );
            });

            it('throws error if the Password field is not defined', async () => {
                const fileContent = ['EmailAddresses', 'alice@mydomain.com'].join('\n');
                const file = getFile(fileContent);

                await expect(parseMultiUserCsv([file])).rejects.toThrowError(
                    `It looks like your file is missing the 'Password' header.`
                );
            });

            it('throws error if a row contains too few fields', async () => {
                const fileContent = [defaultCsvFields, 'alice@mydomain.com,alice_password,1073741824,1,0'].join('\n');
                const file = getFile(fileContent);

                await expect(parseMultiUserCsv([file])).rejects.toThrowError('Error on row 1.');
            });

            it('throws error if a row contains too many fields', async () => {
                const fileContent = [
                    defaultCsvFields,
                    'Alice,alice@mydomain.com,alice_password,1073741824,1,0' + ',ExtraItem',
                ].join('\n');
                const file = getFile(fileContent);

                await expect(parseMultiUserCsv([file])).rejects.toThrowError('Error on row 1.');
            });
        });

        describe('parsing', () => {
            it('parses the sample CSV with no errors', async () => {
                const file = getFile(getSampleCSV());
                const result = await parseMultiUserCsv([file]);

                expect(result.errors.length).toBe(0);
            });

            it('trims whitespace', async () => {
                const fileContent = [
                    `  DisplayName ,  EmailAddresses,Password ,TotalStorage ,  VPNAccess,PrivateSubUser  `,
                    /**
                     * `Alice,"` must be of this form - it will parse incorrectly if there is a space before the `"" ie `Alice, "`
                     */
                    `  Alice,"  alice1@mydomain.com , alice2@mydomain.com ",alice_password, 1073741824 ,1 ,0 `,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file]);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);

                expect(user.id).toBe('1');
                expect(user.displayName).toBe('Alice');
                expect(user.emailAddresses.length).toBe(2);
                expect(user.emailAddresses[0]).toBe('alice1@mydomain.com');
                expect(user.emailAddresses[1]).toBe('alice2@mydomain.com');
                expect(user.password).toBe('alice_password');
                expect(user.totalStorage).toBe(1073741824);
                expect(user.vpnAccess).toBe(true);
                expect(user.privateSubUser).toBe(false);
            });

            describe('id', () => {
                it('equals the row number', async () => {
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,1073741824,1,0`,
                        `Bob,bob@mydomain.com,bob_password,1073741824,1,0`,
                        `Charlie,charlie@mydomain.com,charlie_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);

                    expect(result.errors.length).toBe(0);
                    expect(result.users[0].id).toBe('1');
                    expect(result.users[1].id).toBe('2');
                    expect(result.users[2].id).toBe('3');
                });
            });

            describe('displayName', () => {
                it('returns no errors if display name is a string', async () => {
                    const displayName = 'Alice';
                    const fileContent = [
                        defaultCsvFields,
                        `${displayName},alice@mydomain.com,alice_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.displayName).toBe('Alice');
                });

                it('defaults to first address if DisplayName is missing', async () => {
                    const displayName = '';
                    const fileContent = [
                        defaultCsvFields,
                        `${displayName},alice@mydomain.com,alice_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.displayName).toBe('alice@mydomain.com');
                });

                it('casts to a string', async () => {
                    const displayName = 123;
                    const fileContent = [
                        defaultCsvFields,
                        `${displayName},alice@mydomain.com,alice_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.displayName).toBe('123');
                });
            });

            describe('emailAddresses', () => {
                it('adds error if no email addresses are defined', async () => {
                    const emailAddresses = '';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,${emailAddresses},alice_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);

                    expect(result.errors.length).toBe(1);
                    expect(result.errors[0].rowNumber).toBe(1);
                    expect(result.errors[0].type).toBe(CSV_CONVERSION_ERROR_TYPE.EMAIL_REQUIRED);
                });

                it('returns no errors if emailAddresses is a string', async () => {
                    const emailAddresses = 'alice@mydomain.com';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,${emailAddresses},alice_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.emailAddresses.length).toBe(1);
                    expect(user.emailAddresses[0]).toBe('alice@mydomain.com');
                });

                it('parses a list of email addresses', async () => {
                    const emailAddresses = ['alice1@mydomain.com', 'alice2@mydomain.com'];
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,"${emailAddresses.join(',')}",alice_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.emailAddresses.length).toBe(2);
                    expect(user.emailAddresses[0]).toBe('alice1@mydomain.com');
                    expect(user.emailAddresses[1]).toBe('alice2@mydomain.com');
                });

                it('is considered to be defined if set to falsy 0 value', async () => {
                    const emailAddresses = 0;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,${emailAddresses},alice_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.emailAddresses.length).toBe(1);
                    expect(user.emailAddresses[0]).toBe('0');
                });

                it('casts to a string', async () => {
                    const emailAddresses = 123;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,${emailAddresses},alice_password,1073741824,1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.emailAddresses.length).toBe(1);
                    expect(user.emailAddresses[0]).toBe('123');
                });
            });

            describe('password', () => {
                it('adds error if no password is defined', async () => {
                    const password = '';
                    const fileContent = [defaultCsvFields, `Alice,alice@mydomain.com,${password},1073741824,1,0`].join(
                        '\n'
                    );
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);

                    expect(result.errors.length).toBe(1);
                    expect(result.errors[0].rowNumber).toBe(1);
                    expect(result.errors[0].type).toBe(CSV_CONVERSION_ERROR_TYPE.PASSWORD_REQUIRED);
                });

                it('returns no errors if password is a string', async () => {
                    const password = 'alice_password';
                    const fileContent = [defaultCsvFields, `Alice,alice@mydomain.com,${password},1073741824,1,0`].join(
                        '\n'
                    );
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.password).toBe('alice_password');
                });

                it('is considered to be defined if set to falsy 0 value', async () => {
                    const password = 0;
                    const fileContent = [defaultCsvFields, `Alice,alice@mydomain.com,${password},1073741824,1,0`].join(
                        '\n'
                    );
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.password).toBe(`0`);
                });

                it('casts to a string', async () => {
                    const password = 123;
                    const fileContent = [defaultCsvFields, `Alice,alice@mydomain.com,${password},1073741824,1,0`].join(
                        '\n'
                    );
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.password).toBe(`123`);
                });
            });

            describe('totalStorage', () => {
                it('returns no errors if set to a valid number', async () => {
                    const totalStorage = '123';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,${totalStorage},1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.totalStorage).toBe(123);
                });

                it('uses default if value is not a valid number', async () => {
                    const totalStorage = 'not a number';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,${totalStorage},1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.totalStorage).toBe(0);
                });

                it('defaults to 0', async () => {
                    const fileContent = ['EmailAddresses,Password', `alice@mydomain.com,alice_password`].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.totalStorage).toBe(0);
                });
            });

            describe('vpnAccess', () => {
                it('returns no errors if set to 0', async () => {
                    const vpnAccess = 0;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,1073741824,${vpnAccess},0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(false);
                });

                it('returns no errors if set to 1', async () => {
                    const vpnAccess = 1;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,1073741824,${vpnAccess},0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(true);
                });

                it('uses default if value is not a valid number', async () => {
                    const vpnAccess = 'not a number';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,1073741824,${vpnAccess},0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(false);
                });

                it('defaults to false', async () => {
                    const fileContent = ['EmailAddresses,Password', `alice@mydomain.com,alice_password`].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(false);
                });
            });

            describe('privateSubUser', () => {
                it('returns no errors if set to 0', async () => {
                    const privateSubUser = 0;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,1073741824,1,${privateSubUser}`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(false);
                });

                it('returns no errors if set to 1', async () => {
                    const privateSubUser = 1;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,1073741824,1,${privateSubUser}`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(true);
                });

                it('uses default if value is not a valid number', async () => {
                    const privateSubUser = 'not a number';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_password,1073741824,1,${privateSubUser}`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(false);
                });

                it('defaults to false', async () => {
                    const fileContent = ['EmailAddresses,Password', `alice@mydomain.com,alice_password`].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file]);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(false);
                });
            });
        });
    });
});
