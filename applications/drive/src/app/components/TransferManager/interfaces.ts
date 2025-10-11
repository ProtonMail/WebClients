import type { ReactNode } from 'react';

import type { IconName } from '@proton/icons/types';

import type { Download, TransferType, Upload } from './transfer';

export interface TransferProps<T extends TransferType> {
    transfer: T extends TransferType.Download ? Download : Upload;
    type: T;
    onVirusReport?: (params: { transferId: string; linkId?: string; errorMessage?: string }) => void;
}

export interface TransferManagerButtonProps {
    disabled?: boolean;
    testId?: string;
    title: string;
    onClick: () => void;
    iconName: IconName;
}

export interface TransfersManagerButtonsProps {
    buttons: TransferManagerButtonProps[];
    className?: string;
    id?: string;
    children?: ReactNode;
}
