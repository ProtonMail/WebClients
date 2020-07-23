import React, { useState, useEffect, ReactNode } from 'react';
import { c, msgid } from 'ttag';

import {
    useLoading,
    PrimaryButton,
    DialogModal,
    HeaderModal,
    ContentModal,
    InnerModal,
    FooterModal,
    ResetButton,
    LinkButton,
    useModals,
} from 'react-components';

import FolderTree, { FolderTreeItem } from './FolderTree/FolderTree';
import { DriveFolder } from './Drive/DriveFolderProvider';
import HasNoFolders from './HasNoFolders/HasNoFolders';
import { selectMessageForItemList } from './Drive/helpers';
import CreateFolderModal from './CreateFolderModal';
import useDrive from '../hooks/drive/useDrive';
import useListNotifications from '../hooks/util/useListNotifications';
import { useDriveCache } from './DriveCache/DriveCacheProvider';
import { FileBrowserItem } from './FileBrowser/interfaces';

interface Props {
    activeFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
}

const MoveToFolderModal = ({ activeFolder, selectedItems, onClose, ...rest }: Props) => {
    const { createModal } = useModals();
    const cache = useDriveCache();
    const { getShareMeta, getLinkMeta, getFoldersOnlyMetas, moveLinks } = useDrive();
    const { createMoveLinksNotifications } = useListNotifications();
    const [loading, withLoading] = useLoading();
    const [initializing, withInitialize] = useLoading(true);
    const [folders, setFolders] = useState<FolderTreeItem[]>([]);
    const [initiallyExpandedFolders, setInitiallyExpandedFolders] = useState<string[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const [hasNoChildren, setHasNoChildren] = useState(false);

    const { shareId, linkId } = activeFolder;

    const isChildrenComplete = (LinkID: string) => !!cache.get.foldersOnlyComplete(shareId, LinkID);

    const fetchChildrenData = async (linkId: string, loadNextPage = false) => {
        const childrenMetas = await getFoldersOnlyMetas(shareId, linkId, loadNextPage);
        const list = childrenMetas.map((item) => ({
            linkId: item.LinkID,
            name: item.Name,
            children: { list: [], complete: false },
        }));
        const complete = isChildrenComplete(linkId);

        return { list, complete };
    };

    const moveLinksToFolder = async (parentFolderId: string) => {
        const itemsToMove = [...selectedItems];
        const itemsToMoveIds = itemsToMove.map(({ LinkID }) => LinkID);

        const result = await moveLinks(shareId, parentFolderId, itemsToMoveIds);

        const undoAction = async () => {
            const result = await moveLinks(shareId, linkId, itemsToMoveIds);
            createMoveLinksNotifications(itemsToMove, result);
        };

        createMoveLinksNotifications(itemsToMove, result, undoAction);
    };

    useEffect(() => {
        const initializeData = async () => {
            const { LinkID } = await getShareMeta(shareId);
            const meta = await getLinkMeta(shareId, LinkID);
            const children = await fetchChildrenData(LinkID);
            const rootFolder = { linkId: meta.LinkID, name: 'My Files', children };

            setInitiallyExpandedFolders([LinkID]);
            setHasNoChildren(children.list.length === 0);
            setFolders([rootFolder]);
        };

        withInitialize(initializeData()).catch(console.error);
    }, [shareId]);

    const onSelect = (linkId: string) => {
        if (!loading) {
            setSelectedFolder(linkId);
        }
    };

    const loadChildren = async (linkId: string, loadNextPage = false) => {
        let appended = false;
        const addSubfolders = (
            parentId: string,
            current: FolderTreeItem,
            appendChildren: (parent: FolderTreeItem) => void
        ) => {
            if (appended) {
                return;
            }
            if (parentId === current.linkId) {
                appendChildren(current);
            } else {
                const childrenList = current.children.list;
                for (let i = 0; i < childrenList.length; i++) {
                    addSubfolders(parentId, childrenList[i], appendChildren);
                }
            }
        };

        const childrenData = await fetchChildrenData(linkId, loadNextPage);
        const rootFolder = [...folders][0];

        const appendChildren = (parent: FolderTreeItem) => {
            const childrenIds = parent.children.list.map(({ linkId }) => linkId);
            const newChildren = childrenData.list.filter(({ linkId }) => !childrenIds.includes(linkId));
            parent.children = { list: [...parent.children.list, ...newChildren], complete: childrenData.complete };
            setFolders([rootFolder]);
            appended = true;
        };

        addSubfolders(linkId, rootFolder, appendChildren);
    };

    const handleSubmit = async () => {
        if (selectedFolder) {
            await moveLinksToFolder(selectedFolder);
            onClose?.();
        }
    };

    const handleCreateNewFolderClick = (parentFolderId: string) => {
        createModal(
            <CreateFolderModal
                folder={{ shareId, linkId: parentFolderId }}
                onCreateDone={async (newFolderId) => {
                    await loadChildren(parentFolderId);
                    setInitiallyExpandedFolders([...initiallyExpandedFolders, parentFolderId]);
                    onSelect(newFolderId);
                }}
            />
        );
    };

    const modalTitleID = 'MoveToFolderId';
    const itemsToMove = selectedItems.map((item) => item.LinkID);
    const itemsToMoveCount = itemsToMove.length;
    const messages = {
        allFiles: c('Notification').ngettext(msgid`Move 1 file`, `Move ${itemsToMoveCount} files`, itemsToMoveCount),
        allFolders: c('Notification').ngettext(
            msgid`Move 1 folder`,
            `Move ${itemsToMoveCount} folders`,
            itemsToMoveCount
        ),
        mixed: c('Notification').ngettext(msgid`Move 1 item`, `Move ${itemsToMoveCount} items`, itemsToMoveCount),
    };
    const moveIsDisabled = !selectedFolder || itemsToMove.includes(selectedFolder) || linkId === selectedFolder;

    let modalContents = {
        title: selectMessageForItemList(
            selectedItems.map((item) => item.Type),
            messages
        ),
        content: (
            <FolderTree
                folders={folders}
                itemsToMove={itemsToMove}
                initiallyExpandedFolders={initiallyExpandedFolders}
                selectedFolderId={selectedFolder}
                loading={initializing}
                onSelect={onSelect}
                loadChildren={loadChildren}
            />
        ),
        footer: (
            <FooterModal>
                <div className="flex flex-spacebetween w100 flex-nowrap">
                    <LinkButton
                        disabled={loading || !selectedFolder}
                        onClick={() => selectedFolder && handleCreateNewFolderClick(selectedFolder)}
                    >
                        {c('Action').t`Create New Folder`}
                    </LinkButton>
                    <div>
                        <ResetButton disabled={loading} autoFocus>
                            {c('Action').t`Close`}
                        </ResetButton>
                        <PrimaryButton className="ml1" loading={loading} type="submit" disabled={moveIsDisabled}>
                            {c('Action').t`Move`}
                        </PrimaryButton>
                    </div>
                </div>
            </FooterModal>
        ) as ReactNode,
    };

    if (hasNoChildren) {
        modalContents = {
            content: (
                <HasNoFolders
                    onCreate={() => {
                        onClose?.();
                        handleCreateNewFolderClick(folders[0].linkId);
                    }}
                />
            ),
            title: '',
            footer: null,
        };
    }

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} hasClose={!loading} onClose={onClose}>
                {modalContents.title}
            </HeaderModal>
            <ContentModal
                onSubmit={() => {
                    withLoading(handleSubmit()).catch(console.error);
                }}
                onReset={() => {
                    onClose?.();
                }}
            >
                <InnerModal>{modalContents.content}</InnerModal>
                {modalContents.footer}
            </ContentModal>
        </DialogModal>
    );
};

export default MoveToFolderModal;
