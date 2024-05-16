import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { useOpenInDocs } from '../../../store/_documents';
import { hasFoldersSelected, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const OpenInDocsButton = ({ selectedLinks, shareId }: Props) => {
    const selectedLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const { openInDocsAction, showOpenInDocs } = useOpenInDocs(selectedLink?.mimeType);

    if (!showOpenInDocs || isMultiSelect(selectedLinks) || hasFoldersSelected(selectedLinks)) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Open in Docs`}
            icon={<Icon name="file-arrow-out" alt={c('Action').t`Open in Docs`} />}
            onClick={() => {
                if (selectedLink) {
                    openInDocsAction({
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
