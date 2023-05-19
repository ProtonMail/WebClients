import Papa from 'papaparse';
import { c } from 'ttag';

import { logger } from '@proton/pass/utils/logger';

import { ImportReaderError } from './reader.error';

type CSVReaderResult<T extends Record<string, any>> = { items: T[]; ignored: Partial<T>[] };

export const readCSV = async <T extends Record<string, any>>(
    data: string,
    expectedHeaders: (keyof T)[],
    options?: { onErrors: (errors: Papa.ParseError[]) => void }
): Promise<CSVReaderResult<T>> => {
    try {
        return await new Promise<CSVReaderResult<T>>((resolve, reject) => {
            Papa.parse<T>(data, {
                header: true,
                transformHeader: (h) => h.trim().toLocaleLowerCase(),
                skipEmptyLines: true,
                delimiter: ',',
                complete: ({ data, errors }) => {
                    if (errors.length > 0) {
                        const errorDetails = errors.map((err) => err.message).join(', ');
                        logger.debug('[Importer::LastPass]', errorDetails);
                        options?.onErrors(errors);
                    }

                    if (data.length === 0) return reject(c('Error').t`Empty CSV file`);

                    const { items, ignored, missed } = data.reduce<{
                        items: T[];
                        ignored: Partial<T>[];
                        missed: Set<string>;
                    }>(
                        (acc, entry) => {
                            const missedHeaders = (expectedHeaders as string[]).filter(
                                (header) => !Object.keys(entry).includes(header)
                            );
                            missedHeaders.forEach((header) => acc.missed.add(header));
                            acc[missedHeaders.length > 0 ? 'ignored' : 'items'].push(entry);

                            return acc;
                        },
                        { items: [], ignored: [], missed: new Set() }
                    );

                    if (items.length === 0 && missed.size > 0) {
                        const missingHeaders = Array.from(missed.values()).join(', ');
                        return reject(c('Error').t`CSV file is missing expected headers: ${missingHeaders}`);
                    }

                    return resolve({ items, ignored });
                },
                error: (err: Error) => reject(err.message),
            });
        });
    } catch (err: any) {
        throw new ImportReaderError(err);
    }
};
