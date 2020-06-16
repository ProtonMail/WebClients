import React, { useEffect, useState, useCallback, useRef } from 'react';
import useFiles from '../hooks/drive/useFiles';
import { RouteComponentProps } from 'react-router-dom';
import FilePreview, { isPreviewAvailable } from '../components/FilePreview/FilePreview';
import { useLoading } from 'react-components';
import FileSaver from '../utils/FileSaver/FileSaver';
import { LinkURLType } from '../constants';
import { LinkMeta } from '../interfaces/link';
import { getMetaForTransfer } from '../components/Drive/Drive';
import { DownloadControls } from '../components/downloads/download';
import useDrive from '../hooks/drive/useDrive';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
import { useDriveActiveFolder } from '../components/Drive/DriveFolderProvider';
import usePreventLeave from '../hooks/util/usePreventLeave';

const PreviewContainer = ({ match, history }: RouteComponentProps<{ shareId: string; linkId: string }>) => {
    const { shareId, linkId } = match.params;
    const downloadControls = useRef<DownloadControls>();

    const { setFolder } = useDriveActiveFolder();
    const cache = useDriveCache();
    const { getLinkMeta, fetchAllFolderPages } = useDrive();
    const { downloadDriveFile, saveFileTransferFromBuffer, startFileTransfer } = useFiles();
    const { preventLeave } = usePreventLeave();
    const [loading, withLoading] = useLoading(true);
    const [contents, setContents] = useState<Uint8Array[]>();
    const [, setError] = useState();

    const meta = cache.get.linkMeta(shareId, linkId);
    const links = (meta && cache.get.childLinkMetas(shareId, meta.ParentLinkID)) || [];
    const linksAvailableForPreview = links.filter(({ MIMEType }) => isPreviewAvailable(MIMEType));

    useEffect(() => {
        let canceled = false;

        const preloadFile = async () => {
            try {
                const { ParentLinkID, MIMEType } = meta ?? (await getLinkMeta(shareId, linkId));

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
