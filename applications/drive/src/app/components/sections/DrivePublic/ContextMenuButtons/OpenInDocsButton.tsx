import { MimeIcon } from '@proton/components';
import { getOpenInDocsMimeIconName, getOpenInDocsString } from '@proton/shared/lib/drive/translations';
import { mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { useFlagsDriveSheetODSImport } from '../../../../flags/useFlagsDriveSheetODSImport';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    openInDocs: (linkId: string, options?: { redirect?: boolean; download?: boolean; mimeType?: string }) => void;
    linkId: string;
    mimeType: string;
    close: () => void;
}

export const OpenInDocsButton = ({ openInDocs, mimeType, linkId, close }: Props) => {
    const isODSImportEnabled = useFlagsDriveSheetODSImport();
    const openInDocsType = mimeTypeToOpenInDocsType(mimeType, isODSImportEnabled);
    if (!openInDocsType) {
        throw new Error(`Unsupported MIME type for OpenInDocs: ${mimeType}`);
    }
    return (
        <ContextMenuButton
            name={getOpenInDocsString(openInDocsType, mimeType)}
            icon={<MimeIcon name={getOpenInDocsMimeIconName(openInDocsType)} className="mr-2" />}
            testId="context-menu-open-document"
            action={() => openInDocs(linkId, { mimeType })}
            close={close}
        />
    );
};
