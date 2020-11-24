import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import { generateLookupHash as generateLookupHashShared } from 'proton-shared/lib/keys/driveKeys';

export const generateLookupHash = (name: string, hashKey: string) =>
    FEATURE_FLAGS.includes('nonrestrictive-naming')
        ? generateLookupHashShared(name.toLocaleLowerCase(), hashKey)
        : generateLookupHashShared(name.toLocaleLowerCase(), hashKey);
