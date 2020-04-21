import React from 'react';
import { c } from 'ttag';

import { LinkButton } from 'react-components';

import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { LinkType } from '../../interfaces/link';

export const getNotificationTextForItemList = (
    itemList: FileBrowserItem[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    },
    undoAction?: () => void
) => {
    const allFiles = itemList.every(({ Type }) => Type === LinkType.FILE);
    const allFolders = itemList.every(({ Type }) => Type === LinkType.FOLDER);
    const notificationText = (allFiles && messages.allFiles) || (allFolders && messages.allFolders) || messages.mixed;

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

export async function takeActionForAll<T>(toTakeAction: T[], action: (item: T) => Promise<any>) {
    const processedItems: T[] = [];
    const results = await Promise.allSettled(toTakeAction.map((item) => action(item)));

    results.forEach((p, index) => {
        if (p.status === 'fulfilled') {
            processedItems.push(toTakeAction[index]);
        }
    });

    return processedItems;
}
