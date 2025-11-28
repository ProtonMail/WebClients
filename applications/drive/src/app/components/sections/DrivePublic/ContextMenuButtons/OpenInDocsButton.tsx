import { c } from 'ttag';

import { Pill } from '@proton/atoms/Pill/Pill';
import { MimeIcon } from '@proton/components';
import { getOpenInDocsMimeIconName, getOpenInDocsString } from '@proton/shared/lib/drive/translations';
import { mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    openInDocs: (linkId: string) => void;
    linkId: string;
    mimeType: string;
    close: () => void;
}

export const OpenInDocsButton = ({ openInDocs, mimeType, linkId, close }: Props) => {
    const openInDocsType = mimeTypeToOpenInDocsType(mimeType);
    if (!openInDocsType) {
        throw new Error(`Unsupported MIME type for OpenInDocs: ${mimeType}`);
    }
    return (
        <ContextMenuButton
            name={getOpenInDocsString(openInDocsType)}
            icon={<MimeIcon name={getOpenInDocsMimeIconName(openInDocsType)} className="mr-2" />}
            testId="context-menu-open-in-docs"
            action={() => openInDocs(linkId)}
            close={close}
        >
            {openInDocsType.type === 'spreadsheet' && !openInDocsType.isNative && (
                <Pill className="ml-2">{c('Label').t`New`}</Pill>
            )}
        </ContextMenuButton>
    );
};
