import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { useLoading, useCache, useMultiSortedList } from 'react-components';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

import useFiles from '../hooks/drive/useFiles';
import useDrive from '../hooks/drive/useDrive';
import usePreventLeave from '../hooks/util/usePreventLeave';

import FileSaver from '../utils/FileSaver/FileSaver';
import { LinkURLType, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER } from '../constants';
import { LinkMeta, SortKeys } from '../interfaces/link';
import { getMetaForTransfer } from '../components/Drive/Drive';
import { DownloadControls } from '../components/downloads/download';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import { useDriveActiveFolder } from '../components/Drive/DriveFolderProvider';
import FilePreview, { isPreviewAvailable } from '../components/FilePreview/FilePreview';

const PreviewContainer = ({ match, history }: RouteComponentProps<{ shareId: string; linkId: string }>) => {
    const { shareId, linkId } = match.params;
    const downloadControls = useRef<DownloadControls>();
    const sortCacheKey = 'sortParams';
    const sortCache = useCache();
    if (!sortCache.has(sortCacheKey)) {
        sortCache.set(sortCacheKey, {
            sortField: DEFAULT_SORT_FIELD as SortKeys,
            sortOrder: DEFAULT_SORT_ORDER
        });
    }
    const sortParams = sortCache.get(sortCacheKey);
    const { setFolder } = useDriveActiveFolder();
    const cache = useDriveCache();
    const { getLinkMeta, fetchAllFolderPages } = useDrive();
    const { downloadDriveFile, saveFileTransferFromBuffer, startFileTransfer } = useFiles();
    const { preventLeave } = usePreventLeave();
    const [loading, withLoading] = useLoading(true);
    const [contents, setContents] = useState<Uint8Array[]>();
    const [, setError] = useState();

    const meta = cache.get.linkMeta(shareId, linkId);
    const links = (meta && cache.get.childLinkMetas(shareId, meta.ParentLinkID, sortParams)) || [];
    const { sortedList } = useMultiSortedList(links, [
        {
            key: sortParams.sortField,
            direction: sortParams.sortOrder
        },
        {
            key: 'Name',
            direction: SORT_DIRECTION.ASC
        }
    ]);
    const linksAvailableForPreview = sortedList.filter(({ MIMEType }) => isPreviewAvailable(MIMEType));

    useEffect(() => {
        let canceled = false;

        const preloadFile = async () => {
            try {
                const { ParentLinkID, MIMEType, Trashed } = meta ?? (await getLinkMeta(shareId, linkId));

                if (Trashed) {
                    throw new Error('Link is trashed.');
                }

                if (canceled) {
                    return;
                }

                setFolder({ shareId, linkId: ParentLinkID });

                fetchAllFolderPages(shareId, ParentLinkID);

                if (isPreviewAvailable(MIMEType)) {
                    const { contents, controls } = await downloadDriveFile(shareId, linkId);
                    downloadControls.current = controls;
                    setContents(await contents);
                } else {
                    downloadControls.current = undefined;
                    setContents(undefined);
                }
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'TransferCancel') {
                    setError(() => {
                        throw err;
                    });
                }
            }
        };

        if (contents) {
            setContents(undefined);
        }

        withLoading(preloadFile());

        return () => {
            canceled = true;
            downloadControls.current?.cancel();
            downloadControls.current = undefined;
        };
    }, [shareId, linkId]);

    const navigateToParent = useCallback(() => {
        if (meta?.ParentLinkID) {
            history.push(`/drive/${shareId}/${LinkURLType.FOLDER}/${meta.ParentLinkID}`);
        }
    }, [meta?.ParentLinkID, shareId]);

    const navigateToLink = useCallback(
        ({ LinkID }: LinkMeta) => {
            history.push(`/drive/${shareId}/${LinkURLType.FILE}/${LinkID}`);
        },
        [shareId]
    );

    const saveFile = useCallback(async () => {
        if (!meta) {
            return;
        }

        const transferMeta = getMetaForTransfer(meta);
        const fileStream = await (contents
            ? saveFileTransferFromBuffer(contents, transferMeta)
            : startFileTransfer(shareId, linkId, transferMeta));

        preventLeave(FileSaver.saveAsFile(fileStream, transferMeta));
    }, [meta, contents, shareId, linkId]);

    return (
        <FilePreview
            loading={loading}
            contents={contents}
            meta={meta}
            availableLinks={linksAvailableForPreview}
            onOpen={navigateToLink}
            onClose={navigateToParent}
            onSave={saveFile}
        />
    );
};

export default PreviewContainer;
