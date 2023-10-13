import type { AlgorithmInfo } from '@proton/crypto';

export interface KeyPermissions {
    canExportPublicKey: boolean;
    canExportPrivateKey: boolean;
    canSetPrimary: boolean;
    canSetObsolete: boolean;
    canSetNotObsolete: boolean;
    canSetCompromised: boolean;
    canSetNotCompromised: boolean;
    canDelete: boolean;
}

export interface KeyActions {
    onDeleteKey: (id: string) => void;
    onExportPrivateKey: (id: string) => void;
    onExportPublicKey: (id: string) => void;
    onSetPrimary: (id: string) => void;
    onSetCompromised: (id: string) => void;
    onSetNotCompromised: (id: string) => void;
    onSetObsolete: (id: string) => void;
    onSetNotObsolete: (id: string) => void;
}

export enum KeyType {
    User,
    Address,
}

export interface KeyStatus {
    isAddressDisabled: boolean;
    isPrimary: boolean;
    isDecrypted: boolean;
    isCompromised: boolean;
    isObsolete: boolean;
    isLoading: boolean;
    isWeak: boolean;
    isForwarding: boolean;
}

export interface KeyDisplay {
    type: KeyType;
    ID: string;
    fingerprint: string;
    flags: number;
    primary: 0 | 1;
    algorithm: string;
    algorithmInfos: AlgorithmInfo[];
    status: KeyStatus;
    permissions: KeyPermissions;
}

export enum FlagAction {
    MARK_OBSOLETE,
    MARK_NOT_OBSOLETE,
    MARK_COMPROMISED,
    MARK_NOT_COMPROMISED,
    DISABLE_ENCRYPTION,
    ENABLE_ENCRYPTION,
    DISABLE_EXPECT_SIGNED,
    ENABLE_EXPECT_SIGNED,
}
