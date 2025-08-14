/* eslint-disable no-nested-ternary */
import { identityV, objectMapKV } from '../util/objects';

export const oldestDateReducer = (prev: Date | undefined, next: Date) => (!prev ? next : next < prev ? next : prev);

export const objectToPascalCaseKeys = (obj: Record<string, any>): Record<string, any> => {
    return objectMapKV(obj, identityV, stringToPascalCase);
};

export const stringToPascalCase = (s: string): string => (s.length > 0 ? `${s[0].toUpperCase()}${s.slice(1)}` : s);
