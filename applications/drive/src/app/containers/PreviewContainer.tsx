import React, { useEffect, useState, useCallback, useRef } from 'react';
import useFiles from '../hooks/useFiles';
import { RouteComponentProps } from 'react-router-dom';
import FilePreview, { isPreviewAvailable } from '../components/FilePreview/FilePreview';
import { useLoading } from 'react-components';
import { LinkType, ResourceType } from '../interfaces/folder';
import FileSaver from '../utils/FileSaver/FileSaver';
import { FileBrowserItem } from '../components/FileBrowser/FileBrowser';
import useShare from '../hooks/useShare';
import { FOLDER_PAGE_SIZE } from '../constants';
import { DriveLink } from '../interfaces/link';
import { getMetaForTransfer } from '../components/Drive/Drive';
import { DriveFile } from '../interfaces/file';
import { DownloadControls } from '../components/downloads/download';
import { useDriveResource } from '../components/Drive/DriveResourceProvider';

interface PreviewHistoryState {
    preloadedLink?: FileBrowserItem | DriveFile | DriveLink;
}

const PreviewContainer = ({
    match,
    history,
    location
}: RouteComponentProps<{ shareId: string; linkId: string }, {}, PreviewHistoryState | undefined>) => {
    const { shareId, linkId } = match.params;
    const downloadControls = useRef<DownloadControls>();

    const { setResource } = useDriveResource();
    const { getFolderContents } = useShare(shareId);
    const { downloadDriveFile, saveFileTransferFromBuffer, startFileTransfer, getFileMeta } = useFiles(shareId);
    const [loading, withLoading] = useLoading(true);
    const [meta, setMeta] = useState(location.state?.preloadedLink);
    const [contents, setContents] = useState<Uint8Array[]>();
    const [linksAvailableForPreview, setLinksAvailableForPreview] = useState<DriveLink[]>([]);

    useEffect(() => {
        let canceled = false;

        const fetchLinksAvailableForPreview = async (ParentLinkID: string) => {
            const links = await getFolderContents(ParentLinkID, 0, FOLDER_PAGE_SIZE); // TODO: fetch all pages when implemented

            if (!canceled) {
                setLinksAvailableForPreview(links.filter(({ MimeType }) => isPreviewAvailable(MimeType)));
            }
        };

        const preloadFile = async () => {
            try {
                const meta = location.state?.preloadedLink || (await getFileMeta(linkId)).File;

                if (canceled) {
                    return;
                }

                setMeta(meta);
                setResource({ shareId, linkId: meta.ParentLinkID, type: ResourceType.FOLDER });
                fetchLinksAvailableForPreview(meta.ParentLinkID);
                if (isPreviewAvailable(meta.MimeType)) {
                    const { contents, controls } = await downloadDriveFile(linkId);
                    downloadControls.current = controls;
                    setContents(await contents);
                } else {
                    downloadControls.current = undefined;
                    setContents(undefined);
                }
            } catch (err) {
                if (err.name !== 'AbortError' && err.name !== 'TransferCancel') {
                    setContents(() => {
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
    }, [location.state, getFileMeta, downloadDriveFile]);

    const navigateToParent = useCallback(() => {
        if (meta?.ParentLinkID) {
            history.push(`/drive/${shareId}/${LinkType.FOLDER}/${meta.ParentLinkID}`);
        }
    }, [meta?.ParentLinkID, shareId]);

    const navigateToLink = useCallback(
        (preloadedLink: DriveLink) => {
            history.push(`/drive/${shareId}/${LinkType.FILE}/${preloadedLink.LinkID}`, {
                preloadedLink
            });
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
            : startFileTransfer(linkId, transferMeta));

        FileSaver.saveViaDownload(fileStream, transferMeta);
    }, [meta, contents, linkId]);

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
