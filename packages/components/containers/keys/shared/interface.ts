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

export interface KeyStatus {
    isAddressDisabled: boolean;
    isPrimary: boolean;
    isDecrypted: boolean;
    isCompromised: boolean;
    isObsolete: boolean;
    isLoading: boolean;
}

export interface KeyDisplay {
    ID: string;
    fingerprint: string;
    flags: number;
    primary: 0 | 1;
    algorithm: string;
    algorithmInfos: AlgorithmInfo[];
    status: KeyStatus;
    permissions: KeyPermissions;
    isWeak: boolean;
}

export enum FlagAction {
    MARK_OBSOLETE,
    MARK_NOT_OBSOLETE,
    MARK_COMPROMISED,
    MARK_NOT_COMPROMISED,
}
