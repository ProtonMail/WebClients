import { c } from 'ttag';

import { LinkURLType, fileDescriptions } from '@proton/shared/lib/drive/constants';
import isTruthy from '@proton/utils/isTruthy';

import { DecryptedLink } from '../../store';

export const selectMessageForItemList = (
    isFiles: boolean[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    }
) => {
    const allFiles = isFiles.every((isFile) => isFile);
    const allFolders = isFiles.every((isFile) => !isFile);
    const message = (allFiles && messages.allFiles) || (allFolders && messages.allFolders) || messages.mixed;

    return message;
};

export const toLinkURLType = (isFile: boolean) => {
    return isFile ? LinkURLType.FILE : LinkURLType.FOLDER;
};

export const getMimeTypeDescription = (mimeType: string) => {
    if (fileDescriptions[mimeType]) {
        return fileDescriptions[mimeType];
    }
    if (mimeType.startsWith('audio/')) {
        return c('Label').t`Audio file`;
    }
    if (mimeType.startsWith('video/')) {
        return c('Label').t`Video file`;
    }
    if (mimeType.startsWith('text/')) {
        return c('Label').t`Text`;
    }
    if (mimeType.startsWith('image/')) {
        return c('Label').t`Image`;
    }

    return c('Label').t`Unknown file`;
};

export const getSelectedItems = (items: DecryptedLink[], selectedItemIds: string[]): DecryptedLink[] => {
    if (items) {
        return selectedItemIds
            .map((selectedItemId) => items.find(({ linkId, isLocked }) => !isLocked && selectedItemId === linkId))
            .filter(isTruthy) as DecryptedLink[];
    }

    return [];
};
