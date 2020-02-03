import { ImportKey } from './interface';

export const updateKey = (oldKeys: ImportKey[], key: ImportKey, newKey: Partial<ImportKey>) => {
    return oldKeys.map((oldKey) => {
        if (oldKey === key) {
            return { ...oldKey, ...newKey };
        }
        return oldKey;
    });
};
