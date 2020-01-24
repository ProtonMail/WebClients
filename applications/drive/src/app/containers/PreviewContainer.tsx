import React, { useEffect, useState, useCallback } from 'react';
import useFiles from '../hooks/useFiles';
import { RouteComponentProps } from 'react-router-dom';
import FilePreview, { isPreviewAvailable } from '../components/FilePreview/FilePreview';
import { useLoading } from 'react-components';
import { LinkType } from '../interfaces/folder';
import FileSaver from '../utils/FileSaver/FileSaver';
import { FileBrowserItem } from '../components/FileBrowser/FileBrowser';
import useShare from '../hooks/useShare';
import { FOLDER_PAGE_SIZE } from '../constants';
import { DriveLink } from '../interfaces/link';
import { getMetaForTransfer } from '../components/Drive';
import { DriveFile } from '../interfaces/file';

const PreviewContainer = ({
    match,
    history,
    location
}: RouteComponentProps<
    { shareId: string; linkId: string },
    {},
    FileBrowserItem | DriveLink | DriveFile | undefined
>) => {
    const { shareId, linkId } = match.params;

    const { getFolderContents } = useShare(shareId);
    const { downloadDriveFile, saveFileTransferFromBuffer, startFileTransfer, getFileMeta } = useFiles(shareId);
    const [loading, withLoading] = useLoading(true);
    const [meta, setMeta] = useState(location.state);
    const [contents, setContents] = useState<Uint8Array[]>();
    const [linksAvailableForPreview, setLinksAvailableForPreview] = useState<DriveLink[]>([]);

    const fetchLinksAvailableForPreview = async (ParentLinkID: string) => {
        const links = await getFolderContents(ParentLinkID, 0, FOLDER_PAGE_SIZE); // TODO: fetch all pages when implemented

        setLinksAvailableForPreview(links.filter(({ MimeType }) => isPreviewAvailable(MimeType)));
    };

    const preloadFile = async () => {
        try {
            const meta = location.state || (await getFileMeta(linkId)).File;
            setMeta(meta);
            fetchLinksAvailableForPreview(meta.ParentLinkID);
            const contents = isPreviewAvailable(meta.MimeType) ? await downloadDriveFile(linkId) : undefined;
            setContents(contents);
        } catch (err) {
            setContents(() => {
                throw err;
            });
        }
    };

    useEffect(() => {
        withLoading(preloadFile());
    }, [downloadDriveFile, linkId]);

    const navigateToParent = useCallback(() => {
        if (meta?.ParentLinkID) {
            history.push(`/drive/${shareId}/${LinkType.FOLDER}/${meta.ParentLinkID}`);
        }
    }, [meta?.ParentLinkID, shareId]);

    const navigateToLink = useCallback(
        (link: DriveLink) => {
            history.push(`/drive/${shareId}/${LinkType.FILE}/${link.LinkID}`, link);
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
