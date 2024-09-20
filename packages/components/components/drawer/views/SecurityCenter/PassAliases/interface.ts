import type { ModalStateReturnObj } from '@proton/components/components/modalTwo/useModalState';
import type { PassBridgeAliasItem } from '@proton/pass/lib/bridge/types';
import type { AliasOptions, Share, ShareType } from '@proton/pass/types';

export type PassAliasesVault = Share<ShareType.Vault>;

export interface CreateModalFormState {
    name: string;
    /** The complete alias email. Ex: sampleName.suffix@domainname.ext */
    alias: string;
    /** The signed suffix is the suffix + token ensuring it's a valid one */
    signedSuffix: string;
    /** The e-mail this alias should forward to */
    mailbox: AliasOptions['mailboxes'][number];
    /** Alias text notes */
    note: string;
}

export interface PassAliasesProviderReturnedValues {
    /** Fetch needed options to be able to create a new alias request */
    getAliasOptions: () => Promise<AliasOptions>;
    /** If user has aliases saved in the currently decrypted vault */
    hasAliases: boolean;
    /** User had already a vault or not */
    hasUsedProtonPassApp: boolean;
    /** False when PassBridge finished to init and pass aliases values and count are done */
    loading: boolean;
    /** User already opened pass aliases drawer in the current session (not hard refreshed) */
    hadInitialisedPreviously: boolean;
    /** Has user reached pass aliases creation limit  */
    hasReachedAliasesCountLimit: boolean;
    submitNewAlias: (formValues: CreateModalFormState) => Promise<void>;
    passAliasesVaultName: string;
    /**
     * Filtered and ordered list of pass aliases items
     * Trashed items are not present
     */
    passAliasesItems: PassBridgeAliasItem[];
    passAliasesUpsellModal: ModalStateReturnObj;
}
