import type { PublicKeyReference } from '@proton/crypto/lib';

export interface ShareInvitee {
    name: string;
    email: string;
    contactId?: string;
    error?: Error;
    group?: string;
    isExternal?: boolean;
    isLoading?: boolean;
    publicKey?: PublicKeyReference;
}
