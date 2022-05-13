import { getDevice } from '@proton/shared/lib/helpers/browser';
import { Toolbar, useActiveBreakpoint } from '@proton/components';
import { Vr } from '@proton/atoms';

import { DecryptedLink } from '../../../store';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
    RenameButton,
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

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    showOptionsForNoSelection?: boolean;
}

const DriveToolbar = ({ shareId, selectedLinks, showOptionsForNoSelection = true }: Props) => {
    const isDesktop = !getDevice()?.type;
    const { isNarrow } = useActiveBreakpoint();

    const renderSelectionActions = () => {
        if (!selectedLinks.length) {
            if (!showOptionsForNoSelection) {
                return null;
            }
            return (
                <>
                    <CreateNewFolderButton />
                    {isDesktop && (
                        <>
                            <Vr />
                            <UploadFolderButton />
                            <UploadFileButton />
                        </>
                    )}
                    <Vr />
                    <ShareFileButton shareId={shareId} />
                </>
            );
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedLinks={selectedLinks} />
                <DownloadButton shareId={shareId} selectedLinks={selectedLinks} />
                {isNarrow ? (
                    <ActionsDropdown shareId={shareId} selectedLinks={selectedLinks} />
                ) : (
                    <>
                        <ShareLinkButton shareId={shareId} selectedLinks={selectedLinks} />
                        <Vr />
                        <MoveToFolderButton shareId={shareId} selectedLinks={selectedLinks} />
                        <RenameButton shareId={shareId} selectedLinks={selectedLinks} />
                        <DetailsButton shareId={shareId} linkIds={selectedLinks.map(({ linkId }) => linkId)} />
                        <Vr />
                        <MoveToTrashButton shareId={shareId} selectedLinks={selectedLinks} />
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
