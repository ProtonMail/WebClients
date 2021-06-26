import { MB } from '../constants';

export const isFile = async (item: File) => {
    if (item.type !== '' || item.size > MB) {
        return true;
    }

    return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ({ target }) => {
            if (!target?.result) {
                return reject();
            }
            resolve();
        };
        reader.onerror = reject;
        reader.onabort = reject;
        reader.readAsBinaryString(item);
    })
        .then(() => true)
        .catch(() => false);
};

export const countFilesToUpload = (
    files:
        | FileList
        | {
              path: string[];
              file?: File | undefined;
          }[]
) => {
    let count = 0;
    for (const entry of files) {
        const file = 'path' in entry ? entry.file : entry;
        if (file) {
            count += 1;
        }
    }
    return count;
};
