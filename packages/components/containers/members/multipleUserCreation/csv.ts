import type { ParseLocalConfig, ParseResult } from 'papaparse';
import Papa from 'papaparse';

import { MIN_PASSWORD_LENGTH } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import { CreateMemberMode } from '@proton/shared/lib/interfaces';

import { MAX_IMPORT_FILE_SIZE, MAX_NUMBER_OF_USER_ROWS } from './constants';
import CsvConversionError, { CSV_CONVERSION_ERROR_TYPE } from './errors/CsvConversionError';
import { CSV_FORMAT_ERROR_TYPE, CsvFormatError, TooManyUsersError } from './errors/CsvFormatErrors';
import ImportFileError, { IMPORT_ERROR_TYPE } from './errors/ImportFileError';
import type { ImportedCSVUser, SampleCsvUser, UserTemplate } from './types';

export interface CsvConfig {
    multipleAddresses?: boolean;
    includeStorage?: boolean;
    includeVpnAccess?: boolean;
    includePrivateSubUser?: boolean;
    mode: CreateMemberMode;
}

const parseCsv = async <T>(file: File, config: Omit<ParseLocalConfig<T>, 'complete' | 'error'> = {}) =>
    new Promise<ParseResult<T>>((resolve, reject) => {
        Papa.parse(file, {
            ...config,
            complete: resolve,
            error: reject,
        });
    });

const toCsv = <T>(data: T[]) => Papa.unparse(data);

const convertCSVUser = (
    csvUser: ImportedCSVUser,
    rowNumber: number,
    { multipleAddresses, includeStorage, includeVpnAccess, includePrivateSubUser, mode }: CsvConfig
) => {
    const {
        Name,
        EmailAddresses,
        InvitationEmail,
        Password,
        TotalStorage,
        VPNAccess = 0,
        PrivateSubUser = 0,
    } = csvUser;

    if (!EmailAddresses || typeof EmailAddresses !== 'string') {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.EMAIL_REQUIRED);
    }

    if (mode === CreateMemberMode.Password) {
        if (!Password || typeof Password !== 'string') {
            throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.PASSWORD_REQUIRED);
        }

        if (Password.length < MIN_PASSWORD_LENGTH) {
            throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.PASSWORD_LESS_THAN_MIN_LENGTH);
        }
    }

    const emailAddresses = (() => {
        const splitAddresses = EmailAddresses.split(',');

        return (multipleAddresses ? splitAddresses : [splitAddresses[0]]).map((item) => item.trim());
    })();

    const invitationEmail = (() => {
        if (multipleAddresses) {
            return InvitationEmail;
        }
        return emailAddresses[0];
    })();

    if (!multipleAddresses && emailAddresses.length > 1) {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE);
    }

    if (mode === CreateMemberMode.Invitation) {
        if (!invitationEmail || typeof invitationEmail !== 'string') {
            throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVITATION_EMAIL_REQUIRED);
        }
    }

    const displayName = (() => {
        if (!Name || typeof Name !== 'string') {
            return emailAddresses[0];
        }

        return Name;
    })();

    const totalStorage = (() => {
        const totalStorageNumber = +TotalStorage;
        if (!includeStorage || isNaN(totalStorageNumber)) {
            return 0;
        }
        return totalStorageNumber * sizeUnits.GB;
    })();

    const vpnAccess = (() => {
        const vpnAccessNumber = +VPNAccess;

        if (!includeVpnAccess || isNaN(vpnAccessNumber)) {
            return 0;
        }
        return vpnAccessNumber;
    })();
    if (vpnAccess !== 0 && vpnAccess !== 1) {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE);
    }

    const privateSubUser = (() => {
        const privateSubUserNumber = +PrivateSubUser;

        if (!includePrivateSubUser || isNaN(privateSubUserNumber)) {
            return 0;
        }
        return privateSubUserNumber;
    })();
    if (privateSubUser !== 0 && privateSubUser !== 1) {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE);
    }

    const user: UserTemplate = {
        id: `${rowNumber}`,
        emailAddresses,
        invitationEmail,
        password: Password,
        displayName,
        totalStorage,
        vpnAccess: Boolean(vpnAccess),
        privateSubUser: Boolean(privateSubUser),
    };

    return user;
};

const convertCSVUsers = (csvUsers: ImportedCSVUser[], config: CsvConfig) => {
    const users: UserTemplate[] = [];
    const errors: {
        type: CSV_CONVERSION_ERROR_TYPE;
        rowNumber: number;
    }[] = [];

    csvUsers.forEach((csvUser, index) => {
        const rowNumber = index + 1;
        try {
            const convertedUser = convertCSVUser(csvUser, rowNumber, config);
            users.push(convertedUser);
        } catch (error: any) {
            if (error instanceof CsvConversionError) {
                errors.push({
                    type: error.type,
                    rowNumber,
                });
            }
        }
    });

    return {
        users,
        errors,
    };
};

export const parseMultiUserCsv = async (files: File[], config: CsvConfig) => {
    const { multipleAddresses } = config;

    if (files.length === 0) {
        throw new ImportFileError(IMPORT_ERROR_TYPE.NO_FILE_SELECTED);
    }
    const [file] = files;
    const filename = file.name;

    if (!file.size) {
        throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_EMPTY, filename);
    }
    if (file.size > MAX_IMPORT_FILE_SIZE) {
        throw new ImportFileError(IMPORT_ERROR_TYPE.FILE_TOO_BIG, filename);
    }

    const {
        data: csvUsers,
        errors: parseCsvErrors,
        meta,
    } = await parseCsv<ImportedCSVUser>(file, {
        header: true,
        transformHeader: (originalValue) => {
            const value = originalValue.trim();

            if (value === 'DisplayName') {
                return 'Name';
            }

            if (value === 'EmailAddress') {
                return 'EmailAddresses';
            }

            return value;
        },
        transform: (value) => value.trim(),
        comments: '#',
        skipEmptyLines: true,
    });

    /**
     * Limit number of rows
     */
    if (csvUsers.length > MAX_NUMBER_OF_USER_ROWS) {
        throw new TooManyUsersError();
    }

    if (multipleAddresses && !meta.fields?.includes('EmailAddresses')) {
        throw new CsvFormatError({
            type: CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD,
            fieldName: 'EmailAddresses',
        });
    }

    if (
        !multipleAddresses &&
        !meta.fields?.includes(
            // Checking EmailAddresses here because the EmailAddress header is transformed to EmailAddresses in transformHeader
            'EmailAddresses'
        )
    ) {
        throw new CsvFormatError({
            type: CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD,
            fieldName: 'EmailAddress',
        });
    }

    if (config.mode === CreateMemberMode.Password) {
        if (!meta.fields?.includes('Password')) {
            throw new CsvFormatError({ type: CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD, fieldName: 'Password' });
        }
    }

    if (config.mode === CreateMemberMode.Invitation) {
        if (config.multipleAddresses) {
            if (!meta.fields?.includes('InvitationEmail')) {
                throw new CsvFormatError({
                    type: CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD,
                    fieldName: 'InvitationEmail',
                });
            }
        } else {
            if (!meta.fields?.includes('EmailAddresses')) {
                throw new CsvFormatError({ type: CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD, fieldName: 'Email' });
            }
        }
    }

    if (parseCsvErrors.length) {
        const rowsThatErrored = parseCsvErrors.map(({ row }) => {
            // Row is indexed by 0
            const rowNumber = (row || 0) + 1;
            return `${rowNumber}`;
        });
        throw new CsvFormatError({ type: CSV_FORMAT_ERROR_TYPE.PARSED_CSV_ERRORS, rowsThatErrored });
    }

    return convertCSVUsers(csvUsers, config);
};

const defaultSampleCSV: SampleCsvUser[] = [
    {
        Name: 'Alice',
        InvitationEmail: 'alice@otherdomain.com',
        EmailAddresses: 'alice@mydomain.com',
        Password: 'alice_example_password',
        TotalStorage: 1,
        VPNAccess: 1,
        PrivateSubUser: 0,
    },
    {
        Name: 'Bob',
        InvitationEmail: 'bob@otherdomain.com',
        EmailAddresses: 'bob@mydomain.com',
        Password: 'bob_example_password',
        TotalStorage: 1,
        VPNAccess: 0,
        PrivateSubUser: 1,
    },
    {
        Name: 'Charlie',
        InvitationEmail: 'charlie@otherdomain.com',
        EmailAddresses: 'charlie@mydomain.com, anotheraddress@mydomain.com, notanotherone@mydomain.com',
        Password: 'charlie_example_password',
        TotalStorage: 1,
        VPNAccess: 1,
        PrivateSubUser: 1,
    },
];

export function getSampleCSV(
    userArray: SampleCsvUser[] = defaultSampleCSV,
    { multipleAddresses, includeStorage, includeVpnAccess, includePrivateSubUser, mode }: CsvConfig
) {
    const commentLine = {
        Name: '# Display name for the user (optional) must be unique',
        ...(mode === CreateMemberMode.Password
            ? {
                  ...(multipleAddresses
                      ? {
                            EmailAddresses:
                                '# Enter the email address you want to set up for this user. To add more than 1 email address for a user, separate the addresses with commas.',
                        }
                      : {
                            EmailAddress: '# Enter the email address you want to set up for this user',
                        }),
                  Password: '# Add a password with a minimum of 8 characters for their account',
              }
            : {
                  ...(multipleAddresses
                      ? {
                            InvitationEmail: '# An invitation will be sent to this email address',
                            EmailAddresses:
                                '# Enter the Proton email address you want to set up for this user. To add more than 1 email address for a user, separate the addresses with commas.',
                        }
                      : {
                            EmailAddress: '# An invitation will be sent to this email address',
                        }),
              }),
        ...(includeStorage ? { TotalStorage: '# Amount of storage the user will have in GiB' } : {}),
        ...(includeVpnAccess
            ? {
                  VPNAccess: '# Enter 1 to give the user a VPN account',
              }
            : {}),
        ...(includePrivateSubUser
            ? {
                  PrivateSubUser: '# Enter 1 to make the user account private',
              }
            : {}),
    };

    return toCsv([
        commentLine,
        ...userArray.map((user) => {
            const { Password, EmailAddresses, InvitationEmail, TotalStorage, VPNAccess, PrivateSubUser, ...rest } =
                user;
            return {
                ...(mode === CreateMemberMode.Password
                    ? {
                          ...(multipleAddresses
                              ? {
                                    EmailAddresses,
                                    Password,
                                }
                              : {
                                    // Only use the first email from the sample data
                                    EmailAddress: EmailAddresses.split(',')[0],
                                    Password,
                                }),
                      }
                    : {
                          ...(multipleAddresses
                              ? {
                                    EmailAddresses,
                                    InvitationEmail,
                                }
                              : {
                                    // Only use the first email from the sample data
                                    EmailAddress: EmailAddresses.split(',')[0],
                                }),
                      }),
                ...(includeStorage ? { TotalStorage } : {}),
                ...(includeVpnAccess ? { VPNAccess } : {}),
                ...(includePrivateSubUser ? { PrivateSubUser } : {}),
                ...rest,
            };
        }),
    ]);
}

export const downloadSampleCSV = (config: CsvConfig) => {
    const csv = getSampleCSV(undefined, config);
    const blob = new Blob([csv], { type: 'text/csv' });

    downloadFile(blob, 'example_proton_bulk_user_upload.csv');
};
