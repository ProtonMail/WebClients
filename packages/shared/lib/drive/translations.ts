import { c } from 'ttag';

import type { MimeName } from '@proton/components/components/icon/MimeIcon';

import { DOCS_APP_NAME, SHEETS_APP_NAME } from '../constants';
import type { OpenInDocsType } from '../helpers/mimetype';
import { SupportedMimeTypes } from './constants';

export const getNumAccessesTooltipMessage = () =>
    c('Info').t`The download count includes both actual downloads and instances when files are previewed.`;
export const getSizeTooltipMessage = () =>
    c('Info')
        .t`The encrypted data is slightly larger due to the overhead of the encryption and signatures, which ensure the security of your data.`;

/**
 * Returns `Open` or `Open in Proton Docs/Sheets` depending on passed `mimeType`.
 */
export const getOpenInDocsString = ({ type, isNative }: OpenInDocsType, mimeType?: string): string => {
    if (isNative) {
        // translator: 'Open' action for documents
        return c('Action').t`Open`;
    }

    let appName = DOCS_APP_NAME;

    switch (type) {
        case 'document':
            appName = DOCS_APP_NAME;
            break;
        case 'spreadsheet':
            appName = SHEETS_APP_NAME;
            break;
    }

    if (mimeType === SupportedMimeTypes.ods) {
        // translator: 'Open in Proton Sheets (Beta)' action
        return c('sheets_2025:Action').t`Open in ${appName} (Beta)`;
    }

    // translator: 'Open in Proton Docs/Sheets' action
    return c('sheets_2025:Action').t`Open in ${appName}`;
};

/**
 * Returns the appropriate icon name for an "Open in Docs/Sheets" action.
 */
export const getOpenInDocsMimeIconName = ({ type }: Pick<OpenInDocsType, 'type'>): MimeName => {
    switch (type) {
        case 'document':
            return 'proton-doc';
        case 'spreadsheet':
            return 'proton-sheet';
    }
};
