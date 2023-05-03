import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import wordPreview from './word';

export const supportedPreviews: { [mimeType: string]: (content: Uint8Array) => Promise<void> } = {
    [SupportedMimeTypes.docx]: wordPreview,
};

export default supportedPreviews;
