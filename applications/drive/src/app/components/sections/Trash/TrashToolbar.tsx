import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { DetailsButton, DownloadButton, LayoutButton, PreviewButton } from '../ToolbarButtons';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ToolbarButtons';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const TrashToolbar = ({ shareId, selectedLinks }: Props) => {
    const selectedLinkIds = selectedLinks.map(({ linkId }) => linkId);

    const renderSelectionActions = () => {
        if (!selectedLinks.length) {
            return null;
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedLinks={selectedLinks} />
                <DownloadButton shareId={shareId} selectedLinks={selectedLinks} disabledFolders />
                <Vr />
                <DetailsButton shareId={shareId} linkIds={selectedLinkIds} />
                <Vr />
                <RestoreFromTrashButton shareId={shareId} selectedLinks={selectedLinks} />
                <DeletePermanentlyButton shareId={shareId} selectedLinks={selectedLinks} />
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

export default TrashToolbar;
