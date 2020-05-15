import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { FormModal, useLoading, PrimaryButton } from 'react-components';

import FolderTree, { FolderTreeItem } from './FolderTree/FolderTree';
import { DriveFolder } from './Drive/DriveFolderProvider';
import { LinkMeta } from '../interfaces/link';
import { ShareMeta } from '../interfaces/share';
import { FileBrowserItem } from './FileBrowser/FileBrowser';

interface Props {
    activeFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
    getShareMeta: (shareId: string) => Promise<ShareMeta>;
    getLinkMeta: (shareId: string, linkId: string) => Promise<LinkMeta>;
    getFoldersOnlyMetas: (shareId: string, linkId: string, fetchNextPage?: boolean) => Promise<LinkMeta[]>;
    isChildrenComplete: (linkId: string) => boolean;
    moveLinksToFolder: (folderId: string) => Promise<void>;
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
    onClose,
    ...rest
}: Props) => {
    const [loading, withLoading] = useLoading();
    const [folders, setFolders] = useState<FolderTreeItem[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>();

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
            const rootFolder = { linkId: meta.LinkID, name: 'My Files', children: { list: [], complete: false } };

            setFolders([rootFolder]);
        };

        initializeData(activeFolder.shareId);
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

    const submitButton = (
        <PrimaryButton loading={loading} type="submit" disabled={!selectedFolder}>
            {c('Action').t`Move`}
        </PrimaryButton>
    );

    const title =
        selectedItems.length === 1 ? c('Title').t`Move 1 file` : c('Title').t`Move ${selectedItems.length} files`;

    return (
        <FormModal
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            title={title}
            submit={submitButton}
            autoFocusClose={false}
            {...rest}
        >
            <FolderTree
                folders={folders}
                selectedFolderId={selectedFolder}
                onSelect={onSelect}
                loadChildren={loadChildren}
            />
        </FormModal>
    );
};

export default MoveToFolderModal;
