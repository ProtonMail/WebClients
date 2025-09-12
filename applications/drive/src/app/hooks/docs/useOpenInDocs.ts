import { type ProtonDocumentType, mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { useFlagsDriveDocs } from '../../flags/useFlagsDriveDocs';
import { useFlagsDriveSheet } from '../../flags/useFlagsDriveSheet';
import { useDocumentActions } from './useDocumentActions';

type OpenInDocsActionParameters = {
    /**
     * Defaults uid of the node provided to
     * `useOpenInDocs`.
     */
    uid?: string;
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

export const useOpenInDocs = (node?: {
    uid: string;
    mediaType: string | undefined;
    parentUid: string | undefined;
}): OpenInDocsInfo => {
    const { openDocument: openDocumentAction, convertDocument } = useDocumentActions();
    const { isDocsEnabled } = useFlagsDriveDocs();
    const isSheetsEnabled = useFlagsDriveSheet();

    // Can't open if the node is not provided or it doesn't have a media type.
    if (!node?.mediaType) {
        return { canOpen: false };
    }

    const openInDocsType = mimeTypeToOpenInDocsType(node.mediaType);
    const hasParent = Boolean(node.parentUid);

    // Can't open if...
    if (
        // the media type can't be opened in Docs
        !openInDocsType ||
        // or Docs is not enabled
        !isDocsEnabled ||
        // or it's a spreadsheet and Sheets is not enabled
        (openInDocsType.type === 'spreadsheet' && !isSheetsEnabled) ||
        // or the node doesn't have a parent
        // (Docs tries to convert by creating a node in the parent folder - if
        // the node doesn't have a parent, it means we don't have access to it)
        !hasParent
    ) {
        return { canOpen: false };
    }
    const { type, isNative } = openInDocsType;

    const openDocument: OpenInDocsAction = async ({ uid, openBehavior = 'tab' }: OpenInDocsActionParameters = {}) => {
        if (!uid) {
            return;
        }
        if (isNative) {
            await openDocumentAction({ uid, type, openBehavior });
        } else {
            await convertDocument({ uid, type });
        }
    };

    return { canOpen: true, openDocument, type, isNative };
};
