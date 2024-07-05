import { c } from 'ttag';

import { DOCS_SHORT_APP_NAME } from '../constants';
import { isProtonDocument } from '../helpers/mimetype';

export const getNumAccessesTooltipMessage = () =>
    c('Info').t`The download count includes both actual downloads and instances when files are previewed.`;
export const getSizeTooltipMessage = () =>
    c('Info')
        .t`The encrypted data is slightly larger due to the overhead of the encryption and signatures, which ensure the security of your data.`;

/**
 * Returns `Open` or `Open in Docs` depending on passed `mimeType`.
 */
export const getOpenInDocsString = (mimeType: string = '') => {
    if (isProtonDocument(mimeType)) {
        // translator: 'Open' action for documents
        return c('Action').t`Open`;
    }

    // translator: 'Open in Docs' action
    return c('Action').t`Open in ${DOCS_SHORT_APP_NAME}`;
};
