import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { DOCS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

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
            title={
                // translator: Open in Docs
                c('Action').t`Open in ${DOCS_SHORT_APP_NAME}`
            }
            icon={
                <Icon
                    name="file-arrow-out"
                    alt={
                        // translator: Open in Docs
                        c('Action').t`Open in ${DOCS_SHORT_APP_NAME}`
                    }
                />
            }
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
