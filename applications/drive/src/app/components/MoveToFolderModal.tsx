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
    ResetButton
} from 'react-components';

import FolderTree, { FolderTreeItem } from './FolderTree/FolderTree';
import { DriveFolder } from './Drive/DriveFolderProvider';
import { LinkMeta } from '../interfaces/link';
import { ShareMeta } from '../interfaces/share';
import { FileBrowserItem } from './FileBrowser/FileBrowser';
import HasNoFolders from './HasNoFolders/HasNoFolders';
import { selectMessageForItemList } from './Drive/helpers';

interface Props {
    activeFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
    getShareMeta: (shareId: string) => Promise<ShareMeta>;
    getLinkMeta: (shareId: string, linkId: string) => Promise<LinkMeta>;
    getFoldersOnlyMetas: (shareId: string, linkId: string, fetchNextPage?: boolean) => Promise<LinkMeta[]>;
    isChildrenComplete: (linkId: string) => boolean;
    moveLinksToFolder: (folderId: string) => Promise<void>;
    openCreateFolderModal: () => Promise<void>;
    onClose?: () => void;
}

const MoveToFolderModal = ({
    activeFolder,
    selectedItems,
    getShareMeta,
    getLinkMeta,
    getFoldersOnlyMetas,
    isChildrenComplete,
    moveLinksToFolder,
    openCreateFolderModal,
    onClose,
    ...rest
}: Props) => {
    const [loading, withLoading] = useLoading();
    const [initializing, withInitialize] = useLoading(true);
    const [folders, setFolders] = useState<FolderTreeItem[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const [hasNoChildren, setHasNoChildren] = useState(false);

    const fetchChildrenData = async (linkId: string, loadNextPage = false) => {
        const childrenMetas = await getFoldersOnlyMetas(activeFolder.shareId, linkId, loadNextPage);
        const list = childrenMetas.map((item) => ({
            linkId: item.LinkID,
            name: item.Name,
            children: { list: [], complete: false }
        }));
        const complete = isChildrenComplete(linkId);

        return { list, complete };
    };

    useEffect(() => {
        const initializeData = async (shareId: string) => {
            const { LinkID } = await getShareMeta(shareId);
            const meta = await getLinkMeta(shareId, LinkID);
            const children = await fetchChildrenData(LinkID);
            const rootFolder = { linkId: meta.LinkID, name: 'My Files', children };

            setHasNoChildren(children.list.length === 0);
            setFolders([rootFolder]);
        };

        withInitialize(initializeData(activeFolder.shareId));
    }, [activeFolder.shareId]);

    const onSelect = (linkId: string) => {
        if (activeFolder.linkId !== linkId) {
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
            parent.children = childrenData;
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

    const handleCreateClick = () => {
        onClose?.();
        openCreateFolderModal();
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
        mixed: c('Notification').ngettext(msgid`Move 1 item`, `Move ${itemsToMoveCount} items`, itemsToMoveCount)
    };

    let modalContents = {
        title: selectMessageForItemList(
            selectedItems.map((item) => item.Type),
            messages
        ),
        content: (
            <FolderTree
                folders={folders}
                itemsToMove={itemsToMove}
                selectedFolderId={selectedFolder}
                loading={initializing}
                onSelect={onSelect}
                loadChildren={loadChildren}
            />
        ),
        footer: (
            <FooterModal>
                <ResetButton disabled={loading} autoFocus={true}>
                    {c('Action').t`Close`}
                </ResetButton>
                <PrimaryButton loading={loading} type="submit" disabled={!selectedFolder}>
                    {c('Action').t`Move`}
                </PrimaryButton>
            </FooterModal>
        ) as ReactNode
    };

    if (hasNoChildren) {
        modalContents = { content: <HasNoFolders onCreate={handleCreateClick} />, title: '', footer: null };
    }

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} hasClose={!loading} onClose={onClose}>
                {modalContents.title}
            </HeaderModal>
            <ContentModal
                onSubmit={() => {
                    withLoading(handleSubmit());
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
