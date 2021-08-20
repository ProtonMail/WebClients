import { useState, useEffect, ReactNode } from 'react';
import { c, msgid } from 'ttag';

import {
    useLoading,
    PrimaryButton,
    DialogModal,
    HeaderModal,
    ContentModal,
    InnerModal,
    FooterModal,
    LinkButton,
    useModals,
    useActiveBreakpoint,
    Button,
    Icon,
} from '@proton/components';

import FolderTree, { FolderTreeItem } from '../FolderTree/FolderTree';
import { DriveFolder } from '../../hooks/drive/useActiveShare';
import HasNoFolders from './HasNoFolders';
import { selectMessageForItemList } from '../sections/helpers';
import CreateFolderModal from '../CreateFolderModal';
import useDrive from '../../hooks/drive/useDrive';
import useListNotifications from '../../hooks/util/useListNotifications';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import ModalContentLoader from '../ModalContentLoader';

interface Props {
    activeFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
}

const MoveToFolderModal = ({ activeFolder, selectedItems, onClose, ...rest }: Props) => {
    const { createModal } = useModals();
    const cache = useDriveCache();
    const { getShareMetaShort, getLinkMeta, getFoldersOnlyMetas, moveLinks } = useDrive();
    const { createMoveLinksNotifications } = useListNotifications();
    const [loading, withLoading] = useLoading();
    const [initializing, withInitialize] = useLoading(true);
    const [folders, setFolders] = useState<FolderTreeItem[]>([]);
    const [initiallyExpandedFolders, setInitiallyExpandedFolders] = useState<string[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const { isNarrow } = useActiveBreakpoint();

    const { shareId, linkId } = activeFolder;

    const isChildrenComplete = (LinkID: string) => !!cache.get.foldersOnlyComplete(shareId, LinkID);

    const fetchChildrenData = async (linkId: string, loadNextPage = false) => {
        const childrenMetas = await getFoldersOnlyMetas(shareId, linkId, loadNextPage);
        const list = childrenMetas.map((item) => ({
            linkId: item.LinkID,
            name: item.Name,
            type: item.Type,
            mimeType: item.MIMEType,
            children: { list: [], complete: false },
        }));
        const complete = isChildrenComplete(linkId);

        return { list, complete };
    };

    const moveLinksToFolder = async (parentFolderId: string) => {
        const toMove = [...selectedItems];
        const toMoveIds = toMove.map(({ LinkID }) => LinkID);

        const moveResult = await moveLinks(shareId, parentFolderId, toMoveIds);

        const undoAction = async () => {
            const toMoveBackIds = moveResult.moved.map(({ LinkID }) => LinkID);
            const moveBackResult = await moveLinks(shareId, linkId, toMoveBackIds);
            createMoveLinksNotifications(toMove, moveBackResult);
        };

        createMoveLinksNotifications(toMove, moveResult, undoAction);
    };

    useEffect(() => {
        const initializeData = async () => {
            const { LinkID } = await getShareMetaShort(shareId);
            const meta = await getLinkMeta(shareId, LinkID);
            const children = await fetchChildrenData(LinkID);
            const rootFolder = {
                linkId: meta.LinkID,
                name: c('Title').t`My files`,
                type: meta.Type,
                mimeType: meta.MIMEType,
                children,
            };

            setInitiallyExpandedFolders([LinkID]);
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

        const childrenData = await fetchChildrenData(linkId, loadNextPage);
        const rootFolder = folders[0];

        const appendChildren = (parent: FolderTreeItem) => {
            const childrenIds = parent.children.list.map(({ linkId }) => linkId);
            const newChildren = childrenData.list.filter(({ linkId }) => !childrenIds.includes(linkId));
            parent.children = { list: [...parent.children.list, ...newChildren], complete: childrenData.complete };
            setFolders([rootFolder]);
            appended = true;
        };

        const addSubfolders = (parentId: string, current: FolderTreeItem) => {
            if (appended) {
                return;
            }
            if (parentId === current.linkId) {
                appendChildren(current);
            } else {
                const childrenList = current.children.list;
                for (let i = 0; i < childrenList.length; i++) {
                    addSubfolders(parentId, childrenList[i]);
                }
            }
        };

        addSubfolders(linkId, rootFolder);
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
        allFiles: c('Notification').ngettext(
            msgid`Move ${itemsToMoveCount} file`,
            `Move ${itemsToMoveCount} files`,
            itemsToMoveCount
        ),
        allFolders: c('Notification').ngettext(
            msgid`Move ${itemsToMoveCount} folder`,
            `Move ${itemsToMoveCount} folders`,
            itemsToMoveCount
        ),
        mixed: c('Notification').ngettext(
            msgid`Move ${itemsToMoveCount} item`,
            `Move ${itemsToMoveCount} items`,
            itemsToMoveCount
        ),
    };
    const moveIsDisabled = !selectedFolder || itemsToMove.includes(selectedFolder) || linkId === selectedFolder;

    let modalContents = {
        title: selectMessageForItemList(
            selectedItems.map((item) => item.Type),
            messages
        ),
        content: (
            <FolderTree
                items={folders}
                initiallyExpandedFolders={initiallyExpandedFolders}
                selectedItemId={selectedFolder}
                loading={initializing}
                rowIsDisabled={(item: FolderTreeItem) => itemsToMove.includes(item.linkId)}
                onSelect={onSelect}
                loadChildren={loadChildren}
            />
        ),
        footer: (
            <FooterModal>
                <div className="flex flex-justify-space-between w100 flex-nowrap">
                    {isNarrow ? (
                        <Button
                            icon
                            disabled={loading || !selectedFolder}
                            onClick={() => selectedFolder && handleCreateNewFolderClick(selectedFolder)}
                            title={c('Action').t`Create new folder`}
                        >
                            <Icon name="folder-plus" />
                        </Button>
                    ) : (
                        <LinkButton
                            disabled={loading || !selectedFolder}
                            onClick={() => selectedFolder && handleCreateNewFolderClick(selectedFolder)}
                        >
                            {c('Action').t`Create new folder`}
                        </LinkButton>
                    )}
                    <div>
                        <Button type="reset" disabled={loading} autoFocus>
                            {c('Action').t`Close`}
                        </Button>
                        <PrimaryButton className="ml1" loading={loading} type="submit" disabled={moveIsDisabled}>
                            {c('Action').t`Move`}
                        </PrimaryButton>
                    </div>
                </div>
            </FooterModal>
        ) as ReactNode,
    };

    if (!initializing && !folders[0]?.children.list.length) {
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
            {initializing ? (
                <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
            ) : (
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
            )}
        </DialogModal>
    );
};

export default MoveToFolderModal;
