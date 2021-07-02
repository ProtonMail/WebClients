import React, { useState, useEffect, ReactNode } from 'react';
import { c } from 'ttag';

import {
    useLoading,
    PrimaryButton,
    DialogModal,
    HeaderModal,
    ContentModal,
    InnerModal,
    FooterModal,
    Button,
    Alert,
    useModals,
} from '@proton/components';

import FolderTree, { FolderTreeItem } from './FolderTree/FolderTree';
import useDrive from '../hooks/drive/useDrive';
import { useDriveCache } from './DriveCache/DriveCacheProvider';
import { FileBrowserItem } from './FileBrowser/interfaces';
import SharingModal from './SharingModal/SharingModal';
import { mapLinksToChildren } from './Drive/helpers';
import { LinkType } from '../interfaces/link';
import HasNoFilesToShare from './FileBrowser/HasNoFilesToShare';
import ModalContentLoader from './ModalContentLoader';

interface Props {
    shareId: string;
    onClose?: () => void;
}

const SelectedFileToShareModal = ({ shareId, onClose, ...rest }: Props) => {
    const cache = useDriveCache();
    const { getShareMetaShort, getLinkMeta, fetchNextFolderContents } = useDrive();
    const [loading, withLoading] = useLoading();
    const [initializing, withInitialize] = useLoading(true);
    const [treeItems, setTreeItems] = useState<FolderTreeItem[]>([]);
    const [initiallyExpandedFolders, setInitiallyExpandedFolders] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileBrowserItem>();
    const { createModal } = useModals();

    const fetchChildrenData = async (linkId: string, loadNextPage = false) => {
        await fetchNextFolderContents(shareId, linkId);
        const contents = cache.get.childLinkMetas(shareId, linkId) || [];
        const list = contents
            .filter((meta) => !meta.Shared)
            .map((item) => ({
                linkId: item.LinkID,
                name: item.Name,
                type: item.Type,
                mimeType: item.MIMEType,
                children: { list: [], complete: false },
            }));

        const complete = !!cache.get.childrenComplete(shareId, linkId);
        return { list, complete, loadNextPage };
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
            setTreeItems([rootFolder]);
        };

        withInitialize(initializeData()).catch(console.error);
    }, [shareId]);

    const onSelect = async (linkId: string) => {
        if (!loading && linkId) {
            const meta = await getLinkMeta(shareId, linkId);
            if (meta.Type === LinkType.FOLDER) {
                return;
            }

            const file = mapLinksToChildren([meta], (linkId) => cache.get.isLinkLocked(shareId, linkId))[0];
            setSelectedFile(file);
        }
    };

    const loadChildren = async (linkId: string, loadNextPage = false) => {
        let appended = false;

        const childrenData = await fetchChildrenData(linkId, loadNextPage);
        const rootFolder = [...treeItems][0];

        const appendChildren = (parent: FolderTreeItem) => {
            const childrenIds = parent.children.list.map(({ linkId }) => linkId);
            const newChildren = childrenData.list.filter(({ linkId }) => !childrenIds.includes(linkId));
            parent.children = { list: [...parent.children.list, ...newChildren], complete: childrenData.complete };
            setTreeItems([rootFolder]);
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
        if (selectedFile) {
            createModal(<SharingModal shareId={shareId} item={selectedFile} />);
            onClose?.();
        }
    };

    const modalTitleID = 'SelectFileToShareId';
    const shareIsDisabled = !selectedFile;

    let modalContents = {
        title: c('Action').t`Share file`,
        content: (
            <>
                <Alert>{c('Info').t`Select an uploaded file and create a link to it.`}</Alert>
                <FolderTree
                    items={treeItems}
                    initiallyExpandedFolders={initiallyExpandedFolders}
                    selectedItemId={selectedFile?.LinkID}
                    loading={initializing}
                    onSelect={onSelect}
                    loadChildren={loadChildren}
                />
            </>
        ),
        footer: (
            <FooterModal>
                <div className="flex flex-justify-space-between w100 flex-nowrap">
                    <Button type="reset" className="w8e" disabled={loading} autoFocus>
                        {c('Action').t`Cancel`}
                    </Button>
                    <PrimaryButton className="ml1 w8e" loading={loading} type="submit" disabled={shareIsDisabled}>
                        {c('Action').t`Create link`}
                    </PrimaryButton>
                </div>
            </FooterModal>
        ) as ReactNode,
    };

    if (!initializing && !treeItems[0]?.children.list.length) {
        modalContents = {
            content: <HasNoFilesToShare />,
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

export default SelectedFileToShareModal;
