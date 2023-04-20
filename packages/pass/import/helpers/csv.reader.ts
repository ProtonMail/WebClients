import Papa from 'papaparse';
import { c } from 'ttag';

export const readCSV = async <T>(data: string, headers: (keyof T)[]): Promise<T[]> =>
    new Promise<T[]>((resolve, reject) =>
        Papa.parse<T>(data, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header, index) => {
                if (header !== headers?.[index]) {
                    throw new Error(c('Error').t`Invalid .csv file`);
                }
                return header;
            },
            complete: ({ errors, data }) => (errors.length > 0 ? reject() : resolve(data)),
            error: (err: Error) => reject(err),
        })
    );
