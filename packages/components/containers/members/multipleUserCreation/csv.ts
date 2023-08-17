import Papa, { ParseLocalConfig, ParseResult } from 'papaparse';

import { GIGA } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import { UserManagementMode } from '../types';
import { MAX_IMPORT_FILE_SIZE, MAX_NUMBER_OF_USER_ROWS } from './constants';
import CsvConversionError, { CSV_CONVERSION_ERROR_TYPE } from './errors/CsvConversionError';
import { CSV_FORMAT_ERROR_TYPE, CsvFormatError, TooManyUsersError } from './errors/CsvFormatErrors';
import ImportFileError, { IMPORT_ERROR_TYPE } from './errors/ImportFileError';
import { ExportedCSVUser, ExportedVpnB2BCSVUser, ImportedCSVUser, UserTemplate } from './types';

const parseCsv = async <T>(file: File, config: Omit<ParseLocalConfig<T>, 'complete' | 'error'> = {}) =>
    new Promise<ParseResult<T>>((resolve, reject) => {
        Papa.parse(file, {
            ...config,
            complete: resolve,
            error: reject,
        });
    });

const toCsv = <T>(data: T[]) => Papa.unparse(data);

const convertCSVUser = (csvUser: ImportedCSVUser, rowNumber: number, mode: UserManagementMode) => {
    const { EmailAddresses, Password, DisplayName, TotalStorage, VPNAccess = 0, PrivateSubUser = 0 } = csvUser;

    if (!EmailAddresses || typeof EmailAddresses !== 'string') {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.EMAIL_REQUIRED);
    }

    if (!Password || typeof Password !== 'string') {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.PASSWORD_REQUIRED);
    }

    const emailAddresses = EmailAddresses.split(',').map((item) => item.trim());

    if (mode === UserManagementMode.VPN_B2B && emailAddresses.length > 1) {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE);
    }

    const displayName = (() => {
        if (!DisplayName || typeof DisplayName !== 'string') {
            return emailAddresses[0];
        }

        return DisplayName;
    })();

    const totalStorage = (() => {
        const totalStorageNumber = +TotalStorage;
        if (isNaN(totalStorageNumber)) {
            return 0;
        }
        return totalStorageNumber * GIGA;
    })();

    const vpnAccess = (() => {
        const vpnAccessNumber = +VPNAccess;

        if (isNaN(vpnAccessNumber)) {
            return 0;
        }
        return vpnAccessNumber;
    })();
    if (vpnAccess !== 0 && vpnAccess !== 1) {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE);
    }

    const privateSubUser = (() => {
        const privateSubUserNumber = +PrivateSubUser;

        if (isNaN(privateSubUserNumber)) {
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
        password: Password,
        displayName,
        totalStorage,
        vpnAccess: Boolean(vpnAccess),
        privateSubUser: Boolean(privateSubUser),
    };

    return user;
};

const convertCSVUsers = (csvUsers: ImportedCSVUser[], mode: UserManagementMode) => {
    const users: UserTemplate[] = [];
    const errors: {
        type: CSV_CONVERSION_ERROR_TYPE;
        rowNumber: number;
    }[] = [];

    csvUsers.forEach((csvUser, index) => {
        const rowNumber = index + 1;
        try {
            const convertedUser = convertCSVUser(csvUser, rowNumber, mode);
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

const headerMap: Record<UserManagementMode, Partial<Record<keyof ImportedCSVUser, string>>> = {
    [UserManagementMode.DEFAULT]: {},
    [UserManagementMode.VPN_B2B]: {
        EmailAddresses: 'EmailAddress',
        DisplayName: 'Name',
    },
};

export const parseMultiUserCsv = async (files: File[], mode: UserManagementMode) => {
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
            for (const [fieldName, header] of Object.entries(headerMap[mode])) {
                if (value === fieldName) {
                    return '';
                } else if (value === header) {
                    return fieldName;
                }
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

    if (!meta.fields?.includes('EmailAddresses')) {
        throw new CsvFormatError({
            type: CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD,
            fieldName: headerMap[mode]?.EmailAddresses ?? 'EmailAddresses',
        });
    }

    if (!meta.fields?.includes('Password')) {
        throw new CsvFormatError({ type: CSV_FORMAT_ERROR_TYPE.MISSING_REQUIRED_FIELD, fieldName: 'Password' });
    }

    if (parseCsvErrors.length) {
        const rowsThatErrored = parseCsvErrors.map(({ row }) => {
            // Row is indexed by 0
            const rowNumber = row + 1;
            return `${rowNumber}`;
        });
        throw new CsvFormatError({ type: CSV_FORMAT_ERROR_TYPE.PARSED_CSV_ERRORS, rowsThatErrored });
    }

    return convertCSVUsers(csvUsers, mode);
};

const defaultSampleCSV: ExportedCSVUser[] = [
    {
        DisplayName: 'Alice',
        EmailAddresses: 'alice@mydomain.com',
        Password: 'alice_password',
        TotalStorage: 1,
        VPNAccess: 1,
        PrivateSubUser: 0,
    },
    {
        DisplayName: 'Bob',
        EmailAddresses: 'bob@mydomain.com',
        Password: 'bob_password',
        TotalStorage: 1,
        VPNAccess: 0,
        PrivateSubUser: 1,
    },
    {
        DisplayName: 'Charlie',
        EmailAddresses: 'charlie@mydomain.com, anotheraddress@mydomain.com, notanotherone@mydomain.com',
        Password: 'charlie_password',
        TotalStorage: 1,
        VPNAccess: 1,
        PrivateSubUser: 1,
    },
];

export const getSampleCSV = (userArray: ExportedCSVUser[] = defaultSampleCSV) => {
    const commentLine = {
        DisplayName: '# Display name for the user',
        EmailAddresses:
            '# Enter the email address you want to set up for this user. To add more than 1 email address for a user, separate the addresses with commas.',
        Password: '# Add a password for their account',
        TotalStorage: '# Amount of storage the user will have in GiB',
        VPNAccess: '# Enter 1 to give the user a VPN account',
        PrivateSubUser: '# Enter 1 to make the user account private',
    };

    return toCsv([commentLine, ...userArray]);
};

export const downloadSampleCSV = () => {
    const csv = getSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });

    downloadFile(blob, 'example_proton_bulk_user_upload.csv');
};

const defaultVpnB2BSampleCSV: ExportedVpnB2BCSVUser[] = [
    {
        Name: 'Alice',
        EmailAddress: 'alice@mydomain.com',
        Password: 'alice_password',
    },
    {
        Name: 'Bob',
        EmailAddress: 'bob@mydomain.com',
        Password: 'bob_password',
    },
    {
        Name: 'Charlie',
        EmailAddress: 'charlie@mydomain.com',
        Password: 'charlie_password',
    },
];

export const getVpnB2BSampleCSV = (userArray: ExportedVpnB2BCSVUser[] = defaultVpnB2BSampleCSV) => {
    const commentLine = {
        Name: '# Names (optional) must be unique',
        EmailAddress: '# Enter the email address you want to set up for this user',
        Password: '# Add a password for their account',
    };

    return toCsv([commentLine, ...userArray]);
};

export const downloadVPNB2BSampleCSV = () => {
    const csv = getVpnB2BSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });

    downloadFile(blob, 'example_proton_bulk_user_upload.csv');
};
