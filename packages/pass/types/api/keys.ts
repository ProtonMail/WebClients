import type { KEY_FLAG } from '@proton/shared/lib/constants';

type Key = {
    Flags: KEY_FLAG;
    PublicKey: string;
    Source: string;
};

export type GetAllPublicKeysResponse = { Address: { Keys: Key[] } };
