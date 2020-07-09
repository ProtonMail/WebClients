import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useLoading, usePreventLeave } from 'react-components';
import useFiles from '../hooks/drive/useFiles';
import useDrive from '../hooks/drive/useDrive';
import FileSaver from '../utils/FileSaver/FileSaver';
import { LinkURLType } from '../constants';
import { LinkMeta } from '../interfaces/link';
import { DownloadControls } from '../components/downloads/download';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import { useDriveActiveFolder } from '../components/Drive/DriveFolderProvider';
import FilePreview from '../components/FilePreview/FilePreview';
import useDriveSorting from '../hooks/drive/useDriveSorting';
import { isTransferCancelError, getMetaForTransfer } from '../utils/transfer';
import { isPreviewAvailable } from '../components/FilePreview/helpers';
import FilePreviewNavigation from '../components/FilePreviewNavigation';

const PreviewContainer = ({ match, history }: RouteComponentProps<{ shareId: string; linkId: string }>) => {
    const { shareId, linkId } = match.params;
    const cache = useDriveCache();
    const downloadControls = useRef<DownloadControls>();
    const { setFolder } = useDriveActiveFolder();
    const { getLinkMeta, fetchAllFolderPages } = useDrive();
    const { downloadDriveFile, saveFileTransferFromBuffer, startFileTransfer } = useFiles();
    const { preventLeave } = usePreventLeave();
    const [loading, withLoading] = useLoading(true);
    const [contents, setContents] = useState<Uint8Array[]>();
    const [, setError] = useState();

    const meta = cache.get.linkMeta(shareId, linkId);
    const { sortedList } = useDriveSorting(
        (sortParams) => (meta && cache.get.childLinkMetas(shareId, meta.ParentLinkID, sortParams)) || []
    );

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

                fetchAllFolderPages(shareId, ParentLinkID).catch(console.error);

                if (isPreviewAvailable(MIMEType)) {
                    const { contents, controls } = await downloadDriveFile(shareId, linkId);
                    downloadControls.current = controls;
                    setContents(await contents);
                } else {
                    downloadControls.current = undefined;
                    setContents(undefined);
                }
            } catch (err) {
                if (!isTransferCancelError(err)) {
                    setError(() => {
                        throw err;
                    });
                }
            }
        };

        if (contents) {
            setContents(undefined);
        }

        withLoading(preloadFile()).catch(console.error);

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
            ? saveFileTransferFromBuffer(contents, transferMeta, { ShareID: shareId, LinkID: linkId })
            : startFileTransfer(shareId, linkId, transferMeta));

        preventLeave(FileSaver.saveAsFile(fileStream, transferMeta)).catch(console.error);
    }, [meta, contents, shareId, linkId]);

    return (
        <FilePreview
            loading={loading}
            contents={contents}
            fileName={meta?.Name}
            mimeType={meta?.MIMEType}
            onClose={navigateToParent}
            onSave={saveFile}
            navigationControls={
                meta && (
                    <FilePreviewNavigation
                        availableLinks={linksAvailableForPreview}
                        openLinkId={meta.LinkID}
                        onOpen={navigateToLink}
                    />
                )
            }
        />
    );
};

export default PreviewContainer;
