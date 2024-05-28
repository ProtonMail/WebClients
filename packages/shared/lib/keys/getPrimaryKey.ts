import { KeyPair } from '../interfaces';

export const getPrimaryKey = <T extends KeyPair>(keys: T[] = []): T | undefined => {
    return keys[0];
};
