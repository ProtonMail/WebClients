import { c } from 'ttag';

import { getDevice } from '@proton/shared/lib/helpers/browser';
import { ToolbarSeparator, Toolbar, useActiveBreakpoint, Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { DriveFolder } from '../../../hooks/drive/useActiveShare';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
    RenameButton,
    ShareButton,
    ShareFileButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import {
    ActionsDropdown,
    CreateNewFolderButton,
    MoveToTrashButton,
    MoveToFolderButton,
    UploadFileButton,
    UploadFolderButton,
} from './ToolbarButtons';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';

interface Props {
    activeFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
}

const DriveToolbar = ({ activeFolder, selectedItems }: Props) => {
    const isDesktop = !getDevice()?.type;
    const { isNarrow } = useActiveBreakpoint();

    const { shareId } = activeFolder;

    /* ES PoC */
    const { getESDBStatus, resumeIndexing, esDelete } = useEncryptedSearchContext();
    const { esEnabled } = getESDBStatus();
    const esButtons = (
        <>
            <ToolbarSeparator />
            <ToolbarButton
                disabled={esEnabled}
                title={c('Action').t`Index`}
                icon={<Icon name="arrow-down-to-screen" />}
                onClick={() => resumeIndexing()}
            />
            <ToolbarButton
                disabled={!esEnabled}
                title={c('Action').t`Remove index`}
                icon={<Icon name="xmark" />}
                onClick={() => esDelete()}
            />
        </>
    );
    /* ES PoC */

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return (
                <>
                    <CreateNewFolderButton />
                    {isDesktop && (
                        <>
                            <ToolbarSeparator />
                            <UploadFolderButton />
                            <UploadFileButton />
                        </>
                    )}
                    <ToolbarSeparator />
                    <ShareFileButton shareId={shareId} />
                    {esButtons}
                </>
            );
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedItems={selectedItems} />
                <ToolbarSeparator />
                <DownloadButton shareId={shareId} selectedItems={selectedItems} />
                {isNarrow ? (
                    <ActionsDropdown shareId={shareId} selectedItems={selectedItems} />
                ) : (
                    <>
                        <ShareButton shareId={shareId} selectedItems={selectedItems} />
                        <ShareLinkButton shareId={shareId} selectedItems={selectedItems} />
                        <ToolbarSeparator />
                        <MoveToFolderButton sourceFolder={activeFolder} selectedItems={selectedItems} />
                        <RenameButton shareId={shareId} selectedItems={selectedItems} />
                        <DetailsButton shareId={shareId} selectedItems={selectedItems} />
                        <ToolbarSeparator />
                        <MoveToTrashButton sourceFolder={activeFolder} selectedItems={selectedItems} />
                        {esButtons}
                    </>
                )}
            </>
        );
    };

    return (
        <Toolbar>
            {renderSelectionActions()}
            <span className="mlauto flex flex-nowrap">
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default DriveToolbar;
