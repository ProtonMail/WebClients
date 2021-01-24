import { KeyPair } from '../interfaces';

export const getPrimaryKey = (keys: KeyPair[] = []): KeyPair | undefined => {
    return keys[0];
};
