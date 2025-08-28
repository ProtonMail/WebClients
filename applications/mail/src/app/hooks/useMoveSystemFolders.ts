import { useEffect, useRef, useState } from 'react';

import type { IconName } from '@proton/components';
import { useApi } from '@proton/components';
import { useSystemFolders } from '@proton/mail';
import { orderSystemFolders, updateSystemFolders } from '@proton/shared/lib/api/labels';
import type { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';

import { getSidebarNavItems, moveSystemFolders } from './useMoveSystemFolders.helpers';

export interface UseMoveSystemFoldersProps {
    showMoved: MailSettings['ShowMoved'];
    showScheduled: boolean;
    showSnoozed: boolean;
    showAlmostAllMail: MailSettings['AlmostAllMail'];
    showSoftDeletedFolder: boolean;
}

export enum SYSTEM_FOLDER_SECTION {
    MAIN = 1,
    MORE = 0,
}

export interface SystemFolderPayload {
    ID: MAILBOX_LABEL_IDS;
    Order: number;
    Display: SYSTEM_FOLDER_SECTION;
    /** Mandatory for "update" api call */
    Color: string;
    /** Mandatory for "update" api call */
    Name: string;
}

export interface BaseSystemFolder {
    labelID: MAILBOX_LABEL_IDS;
    ID: string;
    icon: IconName;
    text: string;
    shortcutText?: string;
    visible: boolean;
    order: number;
    display: SYSTEM_FOLDER_SECTION;
}

export interface SystemFolder extends BaseSystemFolder {
    /** Mandatory fields for api calls */
    payloadExtras: {
        Name: SystemFolderPayload['Color'];
        Color: SystemFolderPayload['Name'];
    };
}

type UseSidebarElementsResponse = [
    sidebarElements: SystemFolder[],
    moveSidebarElements: (draggedId: MAILBOX_LABEL_IDS, droppedId: MAILBOX_LABEL_IDS | 'MORE_FOLDER_ITEM') => void,
    loading: boolean,
];

const useMoveSystemFolders = ({
    showMoved,
    showScheduled,
    showSnoozed,
    showAlmostAllMail,
    showSoftDeletedFolder,
}: UseMoveSystemFoldersProps): UseSidebarElementsResponse => {
    const api = useApi();
    const abortUpdateOrderCallRef = useRef<AbortController>(new AbortController());
    const [systemFoldersFromApi, loading] = useSystemFolders();
    const [systemFolders, setSystemFolders] = useState<SystemFolder[]>([]);
    const [unexpectedSystemFolderIDs, setUnexpectedSystemFolderIDs] = useState<MAILBOX_LABEL_IDS[]>([]);
    const visibleSystemFolders = systemFolders.filter((element) => element.visible);

    const moveItem = (draggedID: MAILBOX_LABEL_IDS, droppedID: MAILBOX_LABEL_IDS | 'MORE_FOLDER_ITEM') => {
        if (draggedID === droppedID) {
            return;
        }

        const nextItems = moveSystemFolders(draggedID, droppedID, systemFolders);

        // Optimistic update
        setSystemFolders(nextItems);

        const prevDraggedItem = systemFolders.find((item) => item.labelID === draggedID);
        const nextDraggedItem = nextItems.find((item) => item.labelID === draggedID);

        if (!prevDraggedItem || !nextDraggedItem) {
            return;
        }

        const hasSectionChanged =
            prevDraggedItem.display !== undefined &&
            nextDraggedItem.display !== undefined &&
            nextDraggedItem.display !== prevDraggedItem.display;

        // Abort prev requests
        abortUpdateOrderCallRef.current.abort();
        abortUpdateOrderCallRef.current = new AbortController();

        if (hasSectionChanged) {
            void api(
                updateSystemFolders(nextDraggedItem.labelID, {
                    Display: nextDraggedItem.display,
                    Color: nextDraggedItem.payloadExtras.Color,
                    Name: nextDraggedItem.payloadExtras.Name,
                })
            );
        }

        void api({
            ...orderSystemFolders({
                LabelIDs: [...nextItems.map((item) => item.labelID), ...unexpectedSystemFolderIDs],
            }),
            signal: abortUpdateOrderCallRef.current.signal,
        });
    };

    useEffect(() => {
        if (systemFoldersFromApi?.length) {
            const formattedLabels: SystemFolderPayload[] = systemFoldersFromApi
                .map((label) => ({
                    ID: label.ID as MAILBOX_LABEL_IDS,
                    Display: label.Display ?? SYSTEM_FOLDER_SECTION.MAIN,
                    Order: label.Order,
                    Color: label.Color,
                    Name: label.Name,
                }))
                .filter((item) => !!item.ID);

            const { orderedSystemFolders, unexpectedFolderIDs } = getSidebarNavItems(
                showMoved,
                showScheduled,
                showSnoozed,
                showAlmostAllMail,
                showSoftDeletedFolder,
                formattedLabels
            );

            setSystemFolders(orderedSystemFolders);
            setUnexpectedSystemFolderIDs(unexpectedFolderIDs);
        }
    }, [systemFoldersFromApi, showMoved, showSnoozed, showScheduled, showAlmostAllMail, showSoftDeletedFolder]);

    return [visibleSystemFolders, moveItem, loading];
};

export default useMoveSystemFolders;
