import { ImportKey } from './interface';

export const updateKey = (oldKeys: ImportKey[], id: string, newKey: Partial<ImportKey>): ImportKey[] => {
    return oldKeys.map((oldKey) => {
        if (oldKey.id !== id) {
            return oldKey;
        }
        return { ...oldKey, ...newKey };
    });
};
