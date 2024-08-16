import { BASE_SIZE, sizeUnits } from '@proton/shared/lib/helpers/size';
import { CreateMemberMode } from '@proton/shared/lib/interfaces';

import type { CsvConfig } from './csv';
import { getSampleCSV, parseMultiUserCsv } from './csv';
import { CSV_CONVERSION_ERROR_TYPE } from './errors/CsvConversionError';
import type { SampleCsvUser } from './types';

const csvConfig = {
    mode: CreateMemberMode.Password,
};

const getCsvConfig = (partial?: Partial<CsvConfig>) => {
    return {
        ...csvConfig,
        ...partial,
    };
};

describe('getSampleCSV', () => {
    it('matches snapshot', () => {
        const sampleCsv = getSampleCSV(undefined, csvConfig);

        expect(sampleCsv).toMatchSnapshot();
    });

    it('allows custom user array', () => {
        const sampleCsv = getSampleCSV(
            [
                {
                    Name: 'Derek',
                    EmailAddresses: 'derek@mydomain.com',
                    Password: 'derek_password',
                },
            ],
            csvConfig
        );

        const userLine = sampleCsv.split('\n');
        const items = userLine[2].split(',');

        expect(items[0]).toEqual('Derek');
        expect(items[1]).toEqual('derek@mydomain.com');
        expect(items[2]).toEqual('derek_password');
    });

    describe('multipleAddresses', () => {
        it('defaults to false', () => {
            const sampleCsv = getSampleCSV(undefined, csvConfig);

            expect(sampleCsv).toMatch(/EmailAddress\b/);
            expect(sampleCsv).not.toMatch(/EmailAddresses\b/);
        });

        describe('when false', () => {
            it('uses EmailAddress header', () => {
                const sampleCsv = getSampleCSV(undefined, csvConfig);

                expect(sampleCsv).toMatch(/EmailAddress\b/);
                expect(sampleCsv).not.toMatch(/EmailAddresses\b/);
            });

            it('uses only the first email address provided', () => {
                const sampleCsv = getSampleCSV(
                    [
                        {
                            Name: 'Alice',
                            EmailAddresses: 'alice@mydomain.com,alice2@mydomain.com',
                            Password: 'alice_example_password',
                        },
                    ],
                    getCsvConfig({ multipleAddresses: false })
                );

                expect(sampleCsv).toMatch(/alice@mydomain.com\b/);
                expect(sampleCsv).not.toMatch(/alice2@mydomain.com\b/);
            });
        });

        describe('when true', () => {
            it('uses EmailAddresses header', () => {
                const sampleCsv = getSampleCSV(undefined, getCsvConfig({ multipleAddresses: true }));

                expect(sampleCsv).toMatch(/EmailAddresses\b/);
                expect(sampleCsv).not.toMatch(/EmailAddress\b/);
                expect(sampleCsv).toMatchSnapshot();
            });

            it('adds all email addresses provided', () => {
                const sampleCsv = getSampleCSV(
                    [
                        {
                            Name: 'Alice',
                            EmailAddresses: 'alice@mydomain.com,alice2@mydomain.com',
                            Password: 'alice_example_password',
                        },
                    ],
                    getCsvConfig({ multipleAddresses: true })
                );

                expect(sampleCsv).toMatch(/alice@mydomain.com\b/);
                expect(sampleCsv).toMatch(/alice2@mydomain.com\b/);
            });
        });
    });

    describe('includeStorage', () => {
        it('defaults to false', () => {
            const sampleCsv = getSampleCSV(undefined, csvConfig);

            expect(sampleCsv).not.toMatch(/TotalStorage\b/);
        });

        describe('when false', () => {
            it('TotalStorage item is not present', () => {
                const sampleCsv = getSampleCSV(undefined, csvConfig);

                expect(sampleCsv).not.toMatch(/TotalStorage\b/);
            });
        });

        describe('when true', () => {
            it('TotalStorage item is present', () => {
                const sampleCsv = getSampleCSV(undefined, getCsvConfig({ includeStorage: true }));

                expect(sampleCsv).toMatch(/TotalStorage\b/);
                expect(sampleCsv).toMatchSnapshot();
            });
        });
    });

    describe('includeVpnAccess', () => {
        it('defaults to false', () => {
            const sampleCsv = getSampleCSV(undefined, csvConfig);

            expect(sampleCsv).not.toMatch(/VPNAccess\b/);
        });

        describe('when false', () => {
            it('VPNAccess item is not present', () => {
                const sampleCsv = getSampleCSV(undefined, csvConfig);

                expect(sampleCsv).not.toMatch(/VPNAccess\b/);
            });
        });

        describe('when true', () => {
            it('VPNAccess item is present', () => {
                const sampleCsv = getSampleCSV(undefined, getCsvConfig({ includeVpnAccess: true }));

                expect(sampleCsv).toMatch(/VPNAccess\b/);
                expect(sampleCsv).toMatchSnapshot();
            });
        });
    });

    describe('includePrivateSubUser', () => {
        it('defaults to false', () => {
            const sampleCsv = getSampleCSV(undefined, csvConfig);

            expect(sampleCsv).not.toMatch(/PrivateSubUser\b/);
        });

        describe('when false', () => {
            it('PrivateSubUser item is not present', () => {
                const sampleCsv = getSampleCSV(undefined, csvConfig);

                expect(sampleCsv).not.toMatch(/PrivateSubUser\b/);
            });
        });

        describe('when true', () => {
            it('PrivateSubUser item is present', () => {
                const sampleCsv = getSampleCSV(undefined, getCsvConfig({ includePrivateSubUser: true }));

                expect(sampleCsv).toMatch(/PrivateSubUser\b/);
                expect(sampleCsv).toMatchSnapshot();
            });
        });
    });
});

describe('parseMultiUserCsv', () => {
    const defaultCsvFields = `DisplayName,EmailAddress,Password,TotalStorage,VPNAccess,PrivateSubUser`;

    const defaultFileName = 'filename';
    const getFile = (fileContent: string, filename: string = defaultFileName) => {
        const blob = new Blob([fileContent]);
        return new File([blob], filename);
    };

    describe('errors', () => {
        const defaultUser: SampleCsvUser = {
            Name: 'Alice',
            EmailAddresses: 'alice@mydomain.com',
            Password: 'alice_example_password',
        };

        it('throws error if no files are passed', async () => {
            await expect(parseMultiUserCsv([], csvConfig)).rejects.toThrow(
                'An error occurred uploading your file. No file has been selected.'
            );
        });

        it('throws error if no files are passed', async () => {
            await expect(parseMultiUserCsv([], csvConfig)).rejects.toThrow(
                'An error occurred uploading your file. No file has been selected.'
            );
        });

        it('throws error if file is > 10MB', async () => {
            const file = getFile(getSampleCSV([defaultUser], csvConfig));
            /**
             * Mock large file size
             */
            Object.defineProperty(file, 'size', { value: 10 * BASE_SIZE ** 2 + 1 });

            await expect(parseMultiUserCsv([file], csvConfig)).rejects.toThrow(
                'An error occurred uploading your file "filename". Maximum file size is 10 MB.'
            );
        });

        it('does not throw error if file is <= 10MB', async () => {
            const file = getFile(getSampleCSV([defaultUser], csvConfig));
            /**
             * Mock ok file size
             */
            Object.defineProperty(file, 'size', { value: 10 * BASE_SIZE ** 2 });

            await expect(parseMultiUserCsv([file], csvConfig)).resolves.not.toThrow(
                'An error occurred uploading your file "filename". Maximum file size is 10 MB.'
            );
        });

        it('throws error if there are > 750 rows', async () => {
            const rows = Array.from({ length: 751 }, () => defaultUser);
            const file = getFile(getSampleCSV(rows, csvConfig));

            await expect(parseMultiUserCsv([file], csvConfig)).rejects.toThrow(
                'Upload a CSV file with 750 user accounts or less.'
            );
        });

        it('does not throw error if there are <= 750 rows', async () => {
            const rows = Array.from({ length: 750 }, () => defaultUser);
            const file = getFile(getSampleCSV(rows, csvConfig));

            await expect(parseMultiUserCsv([file], csvConfig)).resolves.not.toThrow(
                'Upload a CSV file with 750 user accounts or less.'
            );
        });

        it('throws error if the EmailAddress field is not defined', async () => {
            const fileContent = ['Password', 'alice_example_password'].join('\n');
            const file = getFile(fileContent);

            await expect(parseMultiUserCsv([file], csvConfig)).rejects.toThrow(
                `It looks like your file is missing the 'EmailAddress' header.`
            );
        });

        it('throws error if the Password field is not defined', async () => {
            const fileContent = ['EmailAddress', 'alice@mydomain.com'].join('\n');
            const file = getFile(fileContent);

            await expect(parseMultiUserCsv([file], csvConfig)).rejects.toThrow(
                `It looks like your file is missing the 'Password' header.`
            );
        });

        it('throws error if a row contains too few fields', async () => {
            const fileContent = [defaultCsvFields, 'alice@mydomain.com,alice_example_password,1073741824,1,0'].join(
                '\n'
            );
            const file = getFile(fileContent);

            await expect(parseMultiUserCsv([file], csvConfig)).rejects.toThrow('Error on row 1.');
        });

        it('throws error if a row contains too many fields', async () => {
            const fileContent = [
                defaultCsvFields,
                'Alice,alice@mydomain.com,alice_example_password,1073741824,1,0' + ',ExtraItem',
            ].join('\n');
            const file = getFile(fileContent);

            await expect(parseMultiUserCsv([file], csvConfig)).rejects.toThrow('Error on row 1.');
        });
    });

    describe('parsing', () => {
        it('parses the sample CSV with no errors', async () => {
            const file = getFile(getSampleCSV(undefined, csvConfig));
            const result = await parseMultiUserCsv([file], csvConfig);

            expect(result.errors.length).toBe(0);
        });

        it('trims whitespace', async () => {
            const fileContent = [
                `  DisplayName ,  EmailAddresses,Password ,TotalStorage ,  VPNAccess,PrivateSubUser  `,
                /**
                 * `Alice,"` must be of this form - it will parse incorrectly if there is a space before the `"` ie `Alice, "`
                 */
                `  Alice,"  alice1@mydomain.com ",alice_example_password, 2 ,1 ,0 `,
            ].join('\n');
            const file = getFile(fileContent);

            const result = await parseMultiUserCsv(
                [file],
                getCsvConfig({
                    includeStorage: true,
                    includeVpnAccess: true,
                    includePrivateSubUser: true,
                })
            );
            const user = result.users[0];

            expect(result.errors.length).toBe(0);

            expect(user.id).toBe('1');
            expect(user.displayName).toBe('Alice');
            expect(user.emailAddresses.length).toBe(1);
            expect(user.emailAddresses[0]).toBe('alice1@mydomain.com');
            expect(user.password).toBe('alice_example_password');
            expect(user.totalStorage).toBe(2 * sizeUnits.GB);
            expect(user.vpnAccess).toBe(true);
            expect(user.privateSubUser).toBe(false);
        });

        describe('id', () => {
            it('equals the row number', async () => {
                const fileContent = [
                    defaultCsvFields,
                    `Alice,alice@mydomain.com,alice_example_password,1073741824,1,0`,
                    `Bob,bob@mydomain.com,bob_example_password,1073741824,1,0`,
                    `Charlie,charlie@mydomain.com,charlie_example_password,1073741824,1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);

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
                    `${displayName},alice@mydomain.com,alice_example_password,1073741824,1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.displayName).toBe('Alice');
            });

            it('defaults to first address if DisplayName is missing', async () => {
                const displayName = '';
                const fileContent = [
                    defaultCsvFields,
                    `${displayName},alice@mydomain.com,alice_example_password,1073741824,1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.displayName).toBe('alice@mydomain.com');
            });

            it('casts to a string', async () => {
                const displayName = 123;
                const fileContent = [
                    defaultCsvFields,
                    `${displayName},alice@mydomain.com,alice_example_password,1073741824,1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
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
                    `Alice,${emailAddresses},alice_example_password,1073741824,1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);

                expect(result.errors.length).toBe(1);
                expect(result.errors[0].rowNumber).toBe(1);
                expect(result.errors[0].type).toBe(CSV_CONVERSION_ERROR_TYPE.EMAIL_REQUIRED);
            });

            it('returns no errors if emailAddresses is a string', async () => {
                const emailAddresses = 'alice@mydomain.com';
                const fileContent = [
                    defaultCsvFields,
                    `Alice,${emailAddresses},alice_example_password,1073741824,1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.emailAddresses.length).toBe(1);
                expect(user.emailAddresses[0]).toBe('alice@mydomain.com');
            });

            describe('multipleAddresses', () => {
                it('defaults to false', async () => {
                    const fileContent = ['Password', 'alice_example_password'].join('\n');
                    const file = getFile(fileContent);

                    await expect(parseMultiUserCsv([file], csvConfig)).rejects.toThrow(
                        `It looks like your file is missing the 'EmailAddress' header.`
                    );
                });

                describe('when false', () => {
                    it('parses first email address', async () => {
                        const emailAddresses = ['alice1@mydomain.com', 'alice2@mydomain.com'];
                        const fileContent = [
                            defaultCsvFields,
                            `Alice,"${emailAddresses.join(',')}",alice_example_password,1073741824,1,0`,
                        ].join('\n');
                        const file = getFile(fileContent);

                        const result = await parseMultiUserCsv([file], getCsvConfig({ multipleAddresses: false }));

                        const user = result.users[0];

                        expect(result.errors.length).toBe(0);
                        expect(user.emailAddresses.length).toBe(1);
                        expect(user.emailAddresses[0]).toBe('alice1@mydomain.com');
                    });
                });

                describe('when true', () => {
                    it('throws error if the EmailAddresses field is not defined', async () => {
                        const fileContent = ['Password', 'alice_example_password'].join('\n');
                        const file = getFile(fileContent);

                        await expect(
                            parseMultiUserCsv([file], getCsvConfig({ multipleAddresses: true }))
                        ).rejects.toThrow(`It looks like your file is missing the 'EmailAddresses' header.`);
                    });

                    it('parses a list of email addresses', async () => {
                        const emailAddresses = ['alice1@mydomain.com', 'alice2@mydomain.com'];
                        const fileContent = [
                            defaultCsvFields,
                            `Alice,"${emailAddresses.join(',')}",alice_example_password,1073741824,1,0`,
                        ].join('\n');
                        const file = getFile(fileContent);

                        const result = await parseMultiUserCsv([file], getCsvConfig({ multipleAddresses: true }));
                        const user = result.users[0];

                        expect(result.errors.length).toBe(0);
                        expect(user.emailAddresses.length).toBe(2);
                        expect(user.emailAddresses[0]).toBe('alice1@mydomain.com');
                        expect(user.emailAddresses[1]).toBe('alice2@mydomain.com');
                    });

                    it('trims whitespace', async () => {
                        const fileContent = [
                            `  DisplayName ,  EmailAddresses,Password ,TotalStorage ,  VPNAccess,PrivateSubUser  `,
                            /**
                             * `Alice,"` must be of this form - it will parse incorrectly if there is a space before the `"` ie `Alice, "`
                             */
                            `  Alice,"  alice1@mydomain.com , alice2@mydomain.com ",alice_example_password, 2 ,1 ,0 `,
                        ].join('\n');
                        const file = getFile(fileContent);

                        const result = await parseMultiUserCsv(
                            [file],
                            getCsvConfig({
                                multipleAddresses: true,
                            })
                        );
                        const user = result.users[0];

                        expect(result.errors.length).toBe(0);

                        expect(user.emailAddresses.length).toBe(2);
                        expect(user.emailAddresses[0]).toBe('alice1@mydomain.com');
                        expect(user.emailAddresses[1]).toBe('alice2@mydomain.com');
                    });
                });
            });

            it('is considered to be defined if set to falsy 0 value', async () => {
                const emailAddresses = 0;
                const fileContent = [
                    defaultCsvFields,
                    `Alice,${emailAddresses},alice_example_password,1073741824,1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.emailAddresses.length).toBe(1);
                expect(user.emailAddresses[0]).toBe('0');
            });

            it('casts to a string', async () => {
                const emailAddresses = 123;
                const fileContent = [
                    defaultCsvFields,
                    `Alice,${emailAddresses},alice_example_password,1073741824,1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
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

                const result = await parseMultiUserCsv([file], csvConfig);

                expect(result.errors.length).toBe(1);
                expect(result.errors[0].rowNumber).toBe(1);
                expect(result.errors[0].type).toBe(CSV_CONVERSION_ERROR_TYPE.PASSWORD_REQUIRED);
            });

            it('adds error if no password is defined', async () => {
                const password = '1234567';
                const fileContent = [defaultCsvFields, `Alice,alice@mydomain.com,${password},1073741824,1,0`].join(
                    '\n'
                );
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);

                expect(result.errors.length).toBe(1);
                expect(result.errors[0].rowNumber).toBe(1);
                expect(result.errors[0].type).toBe(CSV_CONVERSION_ERROR_TYPE.PASSWORD_LESS_THAN_MIN_LENGTH);
            });

            it('returns no errors if password is a string', async () => {
                const password = 'alice_example_password';
                const fileContent = [defaultCsvFields, `Alice,alice@mydomain.com,${password},1073741824,1,0`].join(
                    '\n'
                );
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.password).toBe('alice_example_password');
            });

            it('does not throw PASSWORD_REQUIRED error if set to falsy 0 value', async () => {
                const password = 0;
                const fileContent = [defaultCsvFields, `Alice,alice@mydomain.com,${password},1073741824,1,0`].join(
                    '\n'
                );
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);

                expect(
                    result.errors.map(({ type }) => type).includes(CSV_CONVERSION_ERROR_TYPE.PASSWORD_REQUIRED)
                ).toBe(false);
            });

            it('casts to a string', async () => {
                const password = 12345678;
                const fileContent = [defaultCsvFields, `Alice,alice@mydomain.com,${password},1073741824,1,0`].join(
                    '\n'
                );
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.password).toBe(`12345678`);
            });
        });

        describe('includeStorage', () => {
            it('defaults includeStorage to false', async () => {
                const totalStorage = '123';
                const fileContent = [
                    defaultCsvFields,
                    `Alice,alice@mydomain.com,alice_example_password,${totalStorage},1,0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.totalStorage).toBe(0);
            });

            describe('when false', () => {
                it('always returns default total storage of 0', async () => {
                    const totalStorage = '123';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,${totalStorage},1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeStorage: false }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.totalStorage).toBe(0);
                });
            });

            describe('when true', () => {
                it('returns no errors if set to a valid number', async () => {
                    const totalStorage = '123';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,${totalStorage},1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeStorage: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.totalStorage).toBe(123 * sizeUnits.GB);
                });

                it('uses default if value is not a valid number', async () => {
                    const totalStorage = 'not a number';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,${totalStorage},1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeStorage: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.totalStorage).toBe(0);
                });

                it('defaults totalStorage to 0', async () => {
                    const fileContent = ['EmailAddresses,Password', `alice@mydomain.com,alice_example_password`].join(
                        '\n'
                    );
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeStorage: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.totalStorage).toBe(0);
                });

                it('allows decimal values', async () => {
                    const totalStorage = 1.5;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,${totalStorage},1,0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeStorage: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.totalStorage).toBe(1.5 * sizeUnits.GB);
                });
            });
        });

        describe('includeVpnAccess', () => {
            it('defaults to false', async () => {
                const vpnAccess = 0;
                const fileContent = [
                    defaultCsvFields,
                    `Alice,alice@mydomain.com,alice_example_password,1073741824,${vpnAccess},0`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.vpnAccess).toBe(false);
            });

            describe('when false', () => {
                it('always sets vpnAccess to false', async () => {
                    const vpnAccess = 1;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,1073741824,${vpnAccess},0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeVpnAccess: false }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(false);
                });
            });

            describe('when true', () => {
                it('returns no errors if set to 0', async () => {
                    const vpnAccess = 0;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,1073741824,${vpnAccess},0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeVpnAccess: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(false);
                });

                it('returns no errors if set to 1', async () => {
                    const vpnAccess = 1;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,1073741824,${vpnAccess},0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeVpnAccess: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(true);
                });

                it('uses default if value is not a valid number', async () => {
                    const vpnAccess = 'not a number';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,1073741824,${vpnAccess},0`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeVpnAccess: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(false);
                });

                it('defaults vpnAccess to false', async () => {
                    const fileContent = ['EmailAddresses,Password', `alice@mydomain.com,alice_example_password`].join(
                        '\n'
                    );
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includeStorage: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.vpnAccess).toBe(false);
                });
            });
        });

        describe('privateSubUser', () => {
            it('defaults to false', async () => {
                const privateSubUser = 1;
                const fileContent = [
                    defaultCsvFields,
                    `Alice,alice@mydomain.com,alice_example_password,1073741824,1,${privateSubUser}`,
                ].join('\n');
                const file = getFile(fileContent);

                const result = await parseMultiUserCsv([file], csvConfig);
                const user = result.users[0];

                expect(result.errors.length).toBe(0);
                expect(user.privateSubUser).toBe(false);
            });

            describe('when false', () => {
                it('always sets privateSubUser to false', async () => {
                    const privateSubUser = 1;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,1073741824,1,${privateSubUser}`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], csvConfig);
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(false);
                });
            });

            describe('when true', () => {
                it('returns no errors if set to 0', async () => {
                    const privateSubUser = 0;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,1073741824,1,${privateSubUser}`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includePrivateSubUser: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(false);
                });

                it('returns no errors if set to 1', async () => {
                    const privateSubUser = 1;
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,1073741824,1,${privateSubUser}`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includePrivateSubUser: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(true);
                });

                it('uses default if value is not a valid number', async () => {
                    const privateSubUser = 'not a number';
                    const fileContent = [
                        defaultCsvFields,
                        `Alice,alice@mydomain.com,alice_example_password,1073741824,1,${privateSubUser}`,
                    ].join('\n');
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includePrivateSubUser: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(false);
                });

                it('defaults privateSubUser to false', async () => {
                    const fileContent = ['EmailAddresses,Password', `alice@mydomain.com,alice_example_password`].join(
                        '\n'
                    );
                    const file = getFile(fileContent);

                    const result = await parseMultiUserCsv([file], getCsvConfig({ includePrivateSubUser: true }));
                    const user = result.users[0];

                    expect(result.errors.length).toBe(0);
                    expect(user.privateSubUser).toBe(false);
                });
            });
        });
    });
});
