import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import { useDriveContent } from '../DriveContentProvider';
import { LinkType } from '../../../interfaces/link';
import { getMetaForTransfer } from '../Drive';
import useFiles from '../../../hooks/drive/useFiles';
import FileSaver from '../../../utils/FileSaver/FileSaver';

interface Props {
    shareId: string;
    disabled?: boolean;
    className?: string;
}

const DownloadButton = ({ shareId, disabled, className }: Props) => {
    const { startFileTransfer, startFolderTransfer } = useFiles();
    const { fileBrowserControls } = useDriveContent();
    const { selectedItems } = fileBrowserControls;

    const handleDownloadClick = () => {
        selectedItems.forEach(async (item) => {
            if (item.Type === LinkType.FILE) {
                const meta = getMetaForTransfer(item);
                const fileStream = await startFileTransfer(shareId, item.LinkID, meta);
                FileSaver.saveAsFile(fileStream, meta);
            } else {
                const zipSaver = await FileSaver.saveAsZip(item.Name);

                if (zipSaver) {
                    try {
                        await startFolderTransfer(item.Name, shareId, item.LinkID, {
                            onStartFileTransfer: zipSaver.addFile,
                            onStartFolderTransfer: zipSaver.addFolder
                        });
                        zipSaver.close();
                    } catch (e) {
                        zipSaver.abort(e);
                    }
                }
            }
        });
    };

    return (
        <ToolbarButton
            disabled={disabled}
            className={className}
            title={c('Action').t`Download`}
            icon="download"
            onClick={handleDownloadClick}
        />
    );
};

export default DownloadButton;
