import Papa from 'papaparse';
import { c, msgid } from 'ttag';

import { logger } from '@proton/pass/utils/logger';

import { ImportReaderError } from './error';

export type CSVReaderResult<T extends Record<string, any>> = { items: T[]; ignored: Partial<T>[] };

export const readCSV = async <T extends Record<string, any>>(options: {
    data: string;
    headers?: (keyof T)[];
    onError?: (error: string) => void;
    throwOnEmpty?: boolean;
}): Promise<CSVReaderResult<T>> => {
    const throwOnEmpty = options?.throwOnEmpty ?? true;

    try {
        return await new Promise<CSVReaderResult<T>>((resolve, reject) => {
            Papa.parse<T>(options.data, {
                header: Boolean(options.headers),
                transformHeader: (h) => h.trim(),
                skipEmptyLines: true,
                delimiter: ',',
                complete: ({ data, errors }) => {
                    if (errors.length > 0) {
                        const errorDetails = errors.map((err) => err.message).join(', ');
                        logger.debug('[Importer::ReadCSV]', errorDetails);
                        options?.onError?.(
                            `[Error] ${c('Error').ngettext(
                                msgid`Detected ${errors.length} corrupted csv row`,
                                `Detected ${errors.length} corrupted csv rows`,
                                errors.length
                            )}`
                        );
                    }

                    if (throwOnEmpty && data.length === 0) return reject(c('Error').t`Empty CSV file`);

                    const { items, ignored, missed } = data.reduce<{
                        items: T[];
                        ignored: Partial<T>[];
                        missed: Set<string>;
                    }>(
                        (acc, entry) => {
                            const missedHeaders = ((options.headers ?? []) as string[]).filter(
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
