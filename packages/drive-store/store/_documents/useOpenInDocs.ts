import { type ProtonDocumentType, mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink } from '../_links';
import { useDocumentActions } from './useDocumentActions';
import { useDriveDocsFeatureFlag } from './useDriveDocsFeatureFlag';
import { useIsSheetsEnabled } from './useDriveDocsSheetsFF';

type OpenInDocsActionParameters = {
    /**
     * Defaults to the `rootShareId` and `linkId` of the link provided to
     * `useOpenInDocs`.
     */
    link?: { shareId: string; linkId: string };
    /**
     * @default 'tab'
     */
    openBehavior?: 'tab' | 'redirect';
};
type OpenInDocsAction = (parameters?: OpenInDocsActionParameters) => Promise<void>;
export type OpenInDocsInfo =
    | {
          canOpen: true;
          openDocument: OpenInDocsAction;
          type: ProtonDocumentType;
          /**
           * Whether the document is a native Proton document or a
           * convertible document.
           */
          isNative: boolean;
      }
    | { canOpen: false };

export const useOpenInDocs = (
    link?: Pick<DecryptedLink, 'mimeType' | 'parentLinkId' | 'rootShareId' | 'linkId'>
): OpenInDocsInfo => {
    const { openDocument: openDocumentAction, convertDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();

    // Can't open if the link is not provided or it doesn't have a mime type.
    if (!link?.mimeType) {
        return { canOpen: false };
    }

    const { mimeType } = link;
    const openInDocsType = mimeTypeToOpenInDocsType(mimeType);
    const hasParent = Boolean(link?.parentLinkId);

    // Can't open if...
    if (
        // the mime type can't be opened in Docs
        !openInDocsType ||
        // or Docs is not enabled
        !isDocsEnabled ||
        // or it's a spreadsheet and Sheets is not enabled
        (openInDocsType.type === 'spreadsheet' && !isSheetsEnabled) ||
        // or the link doesn't have a parent
        // (Docs tries to convert by creating a node in the parent folder - if
        // the link doesn't have a parent, it means we don't have access to it)
        !hasParent
    ) {
        return { canOpen: false };
    }
    const { type, isNative } = openInDocsType;

    const openDocument: OpenInDocsAction = async ({
        link: linkToOpen = { shareId: link.rootShareId, linkId: link.linkId },
        openBehavior = 'tab',
    }: OpenInDocsActionParameters = {}) => {
        if (isNative) {
            await openDocumentAction({ ...linkToOpen, type, openBehavior });
        } else {
            await convertDocument({ ...linkToOpen, type });
        }
    };

    return { canOpen: true, openDocument, type, isNative };
};
