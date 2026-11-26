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
    /** A setup, welcome or upgrade modal is showing, so nothing else should open on top of it. */
    isModalOpen: boolean;
}

export const WalletSetupModalContext = createContext<WalletSetupModalContextValue>({
    open: noop,
    close: noop,
    isModalOpen: false,
});

export const useWalletSetupModalContext = () => useContext(WalletSetupModalContext);
