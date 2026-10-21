import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { UploadConflictStrategy, type UploadConflictType } from '@proton/drive/modules/upload';
import type { NodeType } from '@proton/drive/sdk';

import type { UploadConflictModalViewProps } from './UploadConflictModalView';

export type UseUploadConflictModalProps = ModalStateProps & {
    name: string;
    nodeType: NodeType;
    conflictType: UploadConflictType;
    onResolve: (strategy: UploadConflictStrategy, applyAll: boolean) => void;
};

export const useUploadConflictModalState = ({
    name,
    nodeType,
    onResolve,
    onClose,
    open,
    onExit,
    conflictType,
}: UseUploadConflictModalProps): UploadConflictModalViewProps & ModalStateProps => {
    const handleCancelAll = () => {
        onResolve(UploadConflictStrategy.Skip, true);
        onClose?.();
    };

    return {
        open,
        onExit,
        onClose,
        name,
        nodeType,
        conflictType,
        onResolve,
        onCancelAll: handleCancelAll,
    };
};
