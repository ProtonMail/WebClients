import { c } from 'ttag';

import { MAX_BACKGROUND_IMAGE_EDGE, MAX_BACKGROUND_SIZE_BYTES } from './constants';
import type { BackgroundRejectionReason } from './validateBackground';

export const getRejectionMessage = (reason: BackgroundRejectionReason): string => {
    const maxMegabytes = MAX_BACKGROUND_SIZE_BYTES / 1024 / 1024;
    const maxEdge = MAX_BACKGROUND_IMAGE_EDGE;

    switch (reason) {
        case 'fileTooLarge':
            return c('Error').t`This image is too large. Pick one under ${maxMegabytes} MB.`;
        case 'nameTooLong':
            return c('Error').t`This file name is too long. Rename the image and try again.`;
        case 'unsupportedType':
            return c('Error').t`Pick a JPEG, PNG or WebP image.`;
        case 'imageTooLarge':
            return c('Error').t`This image is too big. Pick one up to ${maxEdge} pixels wide and tall.`;
        case 'empty':
        case 'undecodable':
            return c('Error').t`This image could not be read. Pick another one.`;
    }
};
