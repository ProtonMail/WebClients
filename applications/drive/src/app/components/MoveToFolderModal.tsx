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
    useModals
} from 'react-components';

import FolderTree, { FolderTreeItem } from './FolderTree/FolderTree';
import { DriveFolder } from './Drive/DriveFolderProvider';
import { FileBrowserItem } from './FileBrowser/FileBrowser';
import HasNoFolders from './HasNoFolders/HasNoFolders';
import { selectMessageForItemList } from './Drive/helpers';
import CreateFolderModal from './CreateFolderModal';
import useDrive from '../hooks/drive/useDrive';
import useListNotifications from '../hooks/util/useListNotifications';
import { useDriveCache } from './DriveCache/DriveCacheProvider';

interface Props {
    activeFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
}

const MoveToFolderModal = ({ activeFolder, selectedItems, onClose, ...rest }: Props) => {
    const { createModal } = useModals();
    const cache = useDriveCache();
    const { getShareMeta, getLinkMeta, getFoldersOnlyMetas, moveLinks, events } = useDrive();
    const { createMoveLinksNotifications } = useListNotifications();
    const [loading, withLoading] = useLoading();
    const [initializing, withInitialize] = useLoading(true);
    const [folders, setFolders] = useState<FolderTreeItem[]>([]);
    const [initiallyExpandedFolders, setInitiallyExpandedFolders] = useState<string[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const [hasNoChildren, setHasNoChildren] = useState(false);

    const isChildrenComplete = (LinkID: string) => !!cache.get.foldersOnlyComplete(activeFolder.shareId, LinkID);

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

    const moveLinksToFolder = async (parentFolderId: string) => {
        const result = await moveLinks(
            activeFolder.shareId,
            parentFolderId,
            selectedItems.map(({ LinkID }) => LinkID)
        );

        createMoveLinksNotifications(selectedItems, result);

        await events.call(activeFolder.shareId);
    };

    useEffect(() => {
        const initializeData = async () => {
            const { LinkID } = await getShareMeta(activeFolder.shareId);
            const meta = await getLinkMeta(activeFolder.shareId, LinkID);
            const children = await fetchChildrenData(LinkID);
            const rootFolder = { linkId: meta.LinkID, name: 'My Files', children };

            setInitiallyExpandedFolders([LinkID]);
            setHasNoChildren(children.list.length === 0);
            setFolders([rootFolder]);
        };

        withInitialize(initializeData());
    }, [activeFolder.shareId]);

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

    const handleCreateNewFolderClick = async (parentFolderId: string) => {
        createModal(
            <CreateFolderModal
                folder={{ shareId: activeFolder.shareId, linkId: parentFolderId }}
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
        mixed: c('Notification').ngettext(msgid`Move 1 item`, `Move ${itemsToMoveCount} items`, itemsToMoveCount)
    };
    const moveIsDisabled =
        !selectedFolder || itemsToMove.includes(selectedFolder) || activeFolder.linkId === selectedFolder;

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
                        <ResetButton disabled={loading} autoFocus={true}>
                            {c('Action').t`Close`}
                        </ResetButton>
                        <PrimaryButton className="ml1" loading={loading} type="submit" disabled={moveIsDisabled}>
                            {c('Action').t`Move`}
                        </PrimaryButton>
                    </div>
                </div>
            </FooterModal>
        ) as ReactNode
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
            footer: null
        };
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
