import { createContext, useContext } from 'react';

import noop from 'lodash/noop';

import type { WalletCreationModalOwnProps, WalletImportModalOwnProps } from '../../components';
import type { WalletAccountCreationModalOwnProps } from '../../components/WalletAccountCreationModal';
import type { WalletBackupModalOwnProps } from '../../components/WalletBackupModal';

export enum WalletSetupModalKind {
    WalletCreation = 'WalletCreation',
    WalletImport = 'WalletImport',
    WalletAccountCreation = 'WalletAccountCreation',
    WalletBackup = 'WalletBackup',
}

type WalletCreationModalData = { kind: WalletSetupModalKind.WalletCreation } & WalletCreationModalOwnProps;
type WalletImportModalData = { kind: WalletSetupModalKind.WalletImport } & WalletImportModalOwnProps;
type WalletBackupModalData = { kind: WalletSetupModalKind.WalletBackup } & WalletBackupModalOwnProps;
type WalletAccountCreationModalData = {
    kind: WalletSetupModalKind.WalletAccountCreation;
} & WalletAccountCreationModalOwnProps;

export type ModalData =
    | WalletCreationModalData
    | WalletImportModalData
    | WalletBackupModalData
    | WalletAccountCreationModalData;

export interface WalletSetupModalContextValue {
    open: (data: ModalData, options?: { onClose?: () => void }) => void;
    close: () => void;
}

export const WalletSetupModalContext = createContext<WalletSetupModalContextValue>({
    open: noop,
    close: noop,
});

export const useWalletSetupModalContext = () => useContext(WalletSetupModalContext);
