import Papa from 'papaparse';
import { c } from 'ttag';

import { ImportReaderError } from './reader.error';

export const readCSV = async <T extends Record<string, any>>(
    data: string,
    expectedHeaders: (keyof T)[]
): Promise<T[]> => {
    try {
        return await new Promise<T[]>((resolve, reject) => {
            Papa.parse<T>(data, {
                header: true,
                skipEmptyLines: true,
                delimiter: ',',
                complete: ({ data, errors }) => {
                    if (errors.length > 0) {
                        const errorDetails = errors.map((err) => err.message).join(', ');
                        return reject(errorDetails);
                    }

                    if (data.length === 0) return reject(c('Error').t`Empty CSV file`);

                    const headers = Object.keys(data[0]);
                    const missed = (expectedHeaders as string[]).filter((header) => !headers.includes(header));

                    if (missed.length > 0) {
                        const missingHeaders = missed.join(', ');
                        return reject(c('Error').t`CSV file is missing expected headers: ${missingHeaders}`);
                    }

                    return resolve(data);
                },
                error: (err: Error) => reject(err.message),
            });
        });
    } catch (err: any) {
        throw new ImportReaderError(err);
    }
};
