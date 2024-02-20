import type { HydratedAccessState } from '@proton/pass/store/reducers';
import type { AliasDetails, AliasMailbox, AliasOptions, ItemRevision, Share, ShareType } from '@proton/pass/types';
import type { MaxAgeMemoizeOptions } from '@proton/pass/utils/fp/memo';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import type { Address, User } from '@proton/shared/lib/interfaces';

export type PassBridgeInitOptions = {
    addresses: Address[];
    authStore: AuthenticationStore;
    user: User;
};

export interface PassBridge {
    ready: () => Promise<boolean>;
    hydrate: (options: PassBridgeInitOptions) => Promise<void>;
    user: {
        /**
         * Get the user plan which includes aliases limit
         */
        getUserAccess: (options: MaxAgeMemoizeOptions) => Promise<HydratedAccessState>;
    };
    vault: {
        /**
         * Resolves the default - oldest, active and owned - vault.
         * If it does not exist, will create one and return it
         * @param hadVault callback to indicate if the user had a vault
         * @param options
         * @param options.maxAge the time it should be cached in SECONDS
         */
        getDefault: (
            hadVault: (hadVault: boolean) => void,
            options: MaxAgeMemoizeOptions
        ) => Promise<Share<ShareType.Vault>>;
    };
    alias: {
        /** Creates an alias item. Call `PassBridge.alias.getAliasOptions` in order
         * to retrieve the available alias options */
        create: (options: PassBridgeAliasCreate) => Promise<PassBridgeAliasItem>;
        /** Retrieves the alias options for a given `shareId`. The alias options
         * will be valid for a limited period of time (10 minutes) */
        getAliasOptions: (shareId: string, options: MaxAgeMemoizeOptions) => Promise<AliasOptions>;
        /** Retrieves and decrypts all alias items for a given shareId and retrieves
         * the alias details for the underlying items. */
        getAllByShareId: (shareId: string, options: MaxAgeMemoizeOptions) => Promise<PassBridgeAliasItem[]>;
    };
}

export type PassBridgeAliasItem = {
    item: ItemRevision<'alias'>;
    aliasDetails: AliasDetails;
};

export type PassBridgeAliasCreate = {
    /** vault shareId to create the alias in */
    shareId: string;
    /** Name of the underlying item  */
    name: string;
    /** Optional note of the underlying item */
    note?: string;
    /** Alias creation options */
    alias: {
        /** The full alias email : `prefix` + `unsigned suffix`.
         * Validate it before submitting using the `validateEmailAddress`
         * helper from `@proton/shared/lib/helpers/email`. */
        aliasEmail: string;
        /** The mailbox to forward emails to. Retrieved from `PassBridge.alias.getAliasOptions` */
        mailbox: AliasMailbox;
        /** Prefix for the alias. Should not include trailing `.` - it is
         * already included in the suffix parameter */
        prefix: string;
        /** A signed suffix retrieved from `PassBridge.alias.getAliasOptions` */
        signedSuffix: string;
    };
};
