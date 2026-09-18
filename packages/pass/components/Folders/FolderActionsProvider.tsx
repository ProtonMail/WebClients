import type { PropsWithChildren } from 'react';
import { type FC, createContext, useMemo, useState } from 'react';

import { createUseContext } from '../../hooks/useContextFactory';
import type { MaybeNull } from '../../types';
import { FolderCreateModal } from './FolderCreateModal';
import { FolderDeleteConfirm } from './FolderDeleteConfirm';
import { FolderEditModal } from './FolderEditModal';
import { FolderMoveItemsConfirm } from './FolderMoveItemsConfirm';

type FolderActionsContextValue = {
    /** Open folder creation modal for the given vault, optionally nesting
     * the new folder under `parentFolderId` (defaults to the vault root). */
    create: (shareId: string, parentFolderId?: MaybeNull<string>) => void;
    edit: (shareId: string, folderId: string, folderName: string) => void;
    delete: (shareId: string, folderId: string, folderName: string) => void;
    moveItems: (shareId: string, folderId: string, folderName: string) => void;
};

type FolderActionState =
    | { view: 'create'; shareId: string; parentFolderId: MaybeNull<string> }
    | { view: 'edit'; shareId: string; folderId: string; folderName: string }
    | { view: 'delete'; shareId: string; folderId: string; folderName: string }
    | { view: 'move-items'; shareId: string; folderId: string; folderName: string };

export const FolderActionsContext = createContext<MaybeNull<FolderActionsContextValue>>(null);
export const useFolderActions = createUseContext(FolderActionsContext);

export const FolderActionsProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<MaybeNull<FolderActionState>>(null);
    const reset = () => setState(null);

    const actions = useMemo<FolderActionsContextValue>(
        () => ({
            create: (shareId, parentFolderId = null) => setState({ view: 'create', shareId, parentFolderId }),
            edit: (shareId, folderId, folderName) => setState({ view: 'edit', shareId, folderId, folderName }),
            delete: (shareId, folderId, folderName) => setState({ view: 'delete', shareId, folderId, folderName }),
            moveItems: (shareId, folderId, folderName) =>
                setState({ view: 'move-items', shareId, folderId, folderName }),
        }),
        []
    );

    return (
        <FolderActionsContext.Provider value={actions}>
            {children}

            {(() => {
                if (!state) return;
                switch (state.view) {
                    case 'create':
                        return (
                            <FolderCreateModal
                                shareId={state.shareId}
                                parentFolderId={state.parentFolderId}
                                onClose={reset}
                            />
                        );
                    case 'edit':
                        return (
                            <FolderEditModal
                                shareId={state.shareId}
                                folderId={state.folderId}
                                folderName={state.folderName}
                                onClose={reset}
                            />
                        );
                    case 'move-items':
                        return (
                            <FolderMoveItemsConfirm
                                shareId={state.shareId}
                                folderId={state.folderId}
                                folderName={state.folderName}
                                onClose={reset}
                            />
                        );
                    case 'delete':
                        return (
                            <FolderDeleteConfirm
                                shareId={state.shareId}
                                folderId={state.folderId}
                                folderName={state.folderName}
                                onClose={reset}
                            />
                        );
                }
            })()}
        </FolderActionsContext.Provider>
    );
};
