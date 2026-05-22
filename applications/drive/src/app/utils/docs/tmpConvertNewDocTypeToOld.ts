// TODO: we will rename the values in `DocumentType` to 'document' and 'spreadsheet' soon, but for now
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype';

import type { DocumentType } from './openInDocs';

// we just convert the new names to the old ones to support both naming patterns to keep changes small.
export function tmpConvertNewDocTypeToOld(type: DocumentType | ProtonDocumentType): DocumentType {
    switch (type) {
        case 'document':
            return 'doc';
        case 'spreadsheet':
            return 'sheet';
        default:
            return type;
    }
}
