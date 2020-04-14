import React from 'react';
import { c } from 'ttag';

import { LinkButton } from 'react-components';

import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { ResourceType } from '../../interfaces/link';

export const getNotificationTextForItemList = (
    itemList: FileBrowserItem[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    },
    undoAction?: () => void
) => {
    const allFiles = itemList.every(({ Type }) => Type === ResourceType.FILE);
    const allFolders = itemList.every(({ Type }) => Type === ResourceType.FOLDER);
    const notificationText = (allFiles && messages.allFiles) || (allFolders && messages.allFolders) || messages.mixed;

    if (undoAction) {
        return (
            <>
                {notificationText}{' '}
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

export const takeActionForAllItems = async (
    toTakeAction: FileBrowserItem[],
    action: (item: FileBrowserItem) => Promise<unknown>
) => {
    const processedItems: FileBrowserItem[] = [];
    const results = await Promise.allSettled(toTakeAction.map((item) => action(item)));

    results.forEach((p, index) => {
        if (p.status === 'fulfilled') {
            processedItems.push(toTakeAction[index]);
        }
    });

    return processedItems;
};
