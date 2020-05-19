import React from 'react';
import { c } from 'ttag';

import { LinkButton } from 'react-components';

import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { LinkType, LinkMeta } from '../../interfaces/link';

export const selectMessageForItemList = (
    types: LinkType[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    }
) => {
    const allFiles = types.every((type) => type === LinkType.FILE);
    const allFolders = types.every((type) => type === LinkType.FOLDER);
    const message = (allFiles && messages.allFiles) || (allFolders && messages.allFolders) || messages.mixed;

    return message;
};

export const getNotificationTextForItemList = (
    types: LinkType[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    },
    undoAction?: () => void
) => {
    const notificationText = selectMessageForItemList(types, messages);

    if (undoAction) {
        return (
            <>
                {notificationText}
                {'. '}
                <LinkButton
                    className="alignbaseline nodecoration bold pm-button--currentColor"
                    onClick={() => undoAction()}
                >
                    {c('Action').t`Undo`}
                </LinkButton>
            </>
        );
    }

    return notificationText;
};

export const mapLinksToChildren = (decryptedLinks: LinkMeta[]): FileBrowserItem[] => {
    return decryptedLinks.map(({ LinkID, Type, Name, Modified, Size, MimeType, ParentLinkID, Trashed }) => ({
        Name,
        LinkID,
        Type,
        Modified,
        Size,
        MimeType,
        ParentLinkID,
        Trashed
    }));
};
