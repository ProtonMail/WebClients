import { MimeIcon, ToolbarButton } from '@proton/components';
import { getOpenInDocsString } from '@proton/shared/lib/drive/translations';

import { DecryptedLink } from '../../../store';
import { useOpenInDocs } from '../../../store/_documents';
import { hasFoldersSelected, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const OpenInDocsButton = ({ selectedLinks, shareId }: Props) => {
    const selectedLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const { openInDocsAction, showOpenInDocs } = useOpenInDocs(selectedLink);

    if (!showOpenInDocs || isMultiSelect(selectedLinks) || hasFoldersSelected(selectedLinks)) {
        return null;
    }

    return (
        <ToolbarButton
            title={getOpenInDocsString(selectedLink?.mimeType)}
            icon={<MimeIcon name="proton-doc" className="mr-2" />}
            onClick={() => {
                if (selectedLink) {
                    void openInDocsAction({
                        shareId,
                        linkId: selectedLink.linkId,
                    });
                }
            }}
            data-testid="toolbar-open-in-docs"
        />
    );
};

export default OpenInDocsButton;
