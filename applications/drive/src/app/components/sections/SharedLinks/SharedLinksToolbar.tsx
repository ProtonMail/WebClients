import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

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
import { StopSharingButton } from './ToolbarButtons';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const SharedLinksToolbar = ({ shareId, selectedLinks }: Props) => {
    const selectedLinkIds = selectedLinks.map(({ linkId }) => linkId);

    const renderSelectionActions = () => {
        if (!selectedLinks.length) {
            return (
                <>
                    <ShareFileButton shareId={shareId} />
                </>
            );
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedLinks={selectedLinks} />
                <DownloadButton shareId={shareId} selectedLinks={selectedLinks} />
                <Vr />
                <RenameButton shareId={shareId} selectedLinks={selectedLinks} />
                <DetailsButton shareId={shareId} linkIds={selectedLinkIds} />
                <Vr />
                <ShareLinkButton shareId={shareId} selectedLinks={selectedLinks} />
                <StopSharingButton shareId={shareId} selectedLinks={selectedLinks} />
            </>
        );
    };

    return (
        <Toolbar>
            {renderSelectionActions()}
            <span className="mlauto flex">
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default SharedLinksToolbar;
