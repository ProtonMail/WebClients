import Papa, { ParseLocalConfig, ParseResult } from 'papaparse';
import { c } from 'ttag';

import { GIGA } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import { MAX_IMPORT_FILE_SIZE, MAX_NUMBER_OF_USER_ROWS } from './constants';
import CsvConversionError, { CSV_CONVERSION_ERROR_TYPE } from './errors/CsvConversionError';
import { CsvFormatError, TooManyUsersError } from './errors/CsvFormatErrors';
import ImportFileError, { IMPORT_ERROR_TYPE } from './errors/ImportFileError';
import { ExportedCSVUser, ImportedCSVUser, UserTemplate } from './types';

const parseCsv = async <T>(file: File, config: Omit<ParseLocalConfig<T>, 'complete' | 'error'> = {}) =>
    new Promise<ParseResult<T>>((resolve, reject) => {
        Papa.parse(file, {
            ...config,
            complete: resolve,
            error: reject,
        });
    });

const toCsv = <T>(data: T[]) => Papa.unparse(data);

const convertCSVUser = (csvUser: ImportedCSVUser, rowNumber: number) => {
    const { EmailAddresses, Password, DisplayName, TotalStorage, VPNAccess = 0, PrivateSubUser = 0 } = csvUser;

    if (EmailAddresses === null || EmailAddresses === undefined || EmailAddresses === '') {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.EMAIL_REQUIRED);
    }

    if (Password === null || Password === undefined || Password === '') {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.PASSWORD_REQUIRED);
    }

    const emailAddresses = `${EmailAddresses}`.split(',').map((item) => item.trim());
    const displayName = (() => {
        if (DisplayName === null || DisplayName === undefined || DisplayName === '') {
            return emailAddresses[0];
        }

        return `${DisplayName}`;
    })();

    const totalStorage = TotalStorage || 20 * GIGA;
    if (typeof totalStorage !== 'number') {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE);
    }

    const vpnAccess = VPNAccess || 0;
    if (typeof vpnAccess !== 'number' || (vpnAccess !== 0 && vpnAccess !== 1)) {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE);
    }

    const privateSubUser = PrivateSubUser || 0;
    if (typeof privateSubUser !== 'number' || (privateSubUser !== 0 && privateSubUser !== 1)) {
        throw new CsvConversionError(CSV_CONVERSION_ERROR_TYPE.INVALID_TYPE);
    }

    const user: UserTemplate = {
        id: `${rowNumber}`,
        emailAddresses,
        password: `${Password}`,
        displayName,
        totalStorage,
        vpnAccess: Boolean(vpnAccess),
        privateSubUser: Boolean(privateSubUser),
    };

    return user;
};

const convertCSVUsers = (csvUsers: ImportedCSVUser[]) => {
    const users: UserTemplate[] = [];
    const errors: {
        type: CSV_CONVERSION_ERROR_TYPE;
        rowNumber: number;
    }[] = [];

    csvUsers.forEach((csvUser, index) => {
        const rowNumber = index + 1;
        try {
            const convertedUser = convertCSVUser(csvUser, rowNumber);
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

export const parseMultiUserCsv = async (files: File[]) => {
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
        dynamicTyping: true,
        comments: '#',
    });

    /**
     * Limit number of rows
     */
    if (csvUsers.length > MAX_NUMBER_OF_USER_ROWS) {
        throw new TooManyUsersError();
    }

    if (!meta.fields?.includes('EmailAddresses')) {
        throw new CsvFormatError(
            c('CSV format error').t`It looks like your file is missing the 'EmailAddresses' header.`
        );
    }

    if (!meta.fields?.includes('Password')) {
        throw new CsvFormatError(c('CSV format error').t`It looks like your file is missing the 'Password' header.`);
    }

    if (parseCsvErrors.length) {
        /**
         * Throw one error at a time
         */
        if (parseCsvErrors.length > 3) {
            throw new CsvFormatError(
                c('CSV format error').t`We detected errors in multiple rows during import, please review your CSV file.`
            );
        }

        const rowsThatErrored = parseCsvErrors
            .map(({ row }) => {
                // Row is indexed by 0
                const rowNumber = row + 1;
                return rowNumber;
            })
            .join(', ');
        throw new CsvFormatError(c('CSV format error').t`Error on row ${rowsThatErrored}.`);
    }

    return convertCSVUsers(csvUsers);
};

export const downloadSampleCSV = () => {
    const commentLine = {
        DisplayName: '# Display name for the user',
        EmailAddresses:
            '# Enter the email address you want to set up for this user. To add more than 1 email address for a user, separate the addresses with commas.',
        Password: '# Add a password for their account',
        TotalStorage: '# Number of bytes of storage the user will have. Defaults to 21474836480 (20GiB).',
        VPNAccess: '# Enter 1 to give the user a VPN account',
        PrivateSubUser: '# Enter 1 to make the user account private',
    };

    const exampleCSV: ExportedCSVUser[] = [
        {
            DisplayName: 'Alice',
            EmailAddresses: 'alice@mydomain.com',
            Password: 'alice_password',
            TotalStorage: GIGA,
            VPNAccess: 1,
            PrivateSubUser: 0,
        },
        {
            DisplayName: 'Bob',
            EmailAddresses: 'bob@mydomain.com',
            Password: 'bob_password',
            TotalStorage: GIGA,
            VPNAccess: 0,
            PrivateSubUser: 1,
        },
        {
            DisplayName: 'Charlie',
            EmailAddresses: 'charlie@mydomain.com, anotheraddress@mydomain.com, notanotherone@mydomain.com',
            Password: 'charlie_password',
            TotalStorage: GIGA,
            VPNAccess: 1,
            PrivateSubUser: 1,
        },
    ];

    const csv = toCsv([commentLine, ...exampleCSV]);
    const blob = new Blob([csv], { type: 'text/csv' });

    downloadFile(blob, 'example_proton_bulk_user_upload.csv');
};
