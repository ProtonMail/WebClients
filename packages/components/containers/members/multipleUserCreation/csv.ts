import Papa, { ParseLocalConfig, ParseResult } from 'papaparse';

export const parseCsv = async <T>(file: File, config: Omit<ParseLocalConfig<T>, 'complete' | 'error'> = {}) =>
    new Promise<ParseResult<T>>((resolve, reject) => {
        Papa.parse(file, {
            ...config,
            complete: resolve,
            error: reject,
        });
    });

export const toCsv = <T>(data: T[]) => Papa.unparse(data);
