import { identityV, objectMapKV } from '../util/objects';

export const objectToPascalCaseKeys = (obj: Record<string, any>): Record<string, any> => {
    return objectMapKV(obj, identityV, stringToPascalCase);
};

const stringToPascalCase = (s: string): string => (s.length > 0 ? `${s[0].toUpperCase()}${s.slice(1)}` : s);
