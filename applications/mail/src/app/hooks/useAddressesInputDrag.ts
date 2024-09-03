import type { Dispatch, DragEvent, RefObject, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import { useCache, useDragOver, useHandler } from '@proton/components';
import type { Recipient } from '@proton/shared/lib/interfaces';
import generateUID from '@proton/utils/generateUID';

import { DRAG_ADDRESS_KEY } from '../constants';
import { matchRecipientOrGroup, recipientOrGroupToRecipients } from '../helpers/message/messageRecipients';
import type { RecipientOrGroup } from '../models/address';

export const ADDRESS_DRAG_CACHE_KEY = 'ADDRESS_DRAG';

interface DragInfo {
    inputID: string;
    recipient: RecipientOrGroup;
    size: { width: number; height: number };
}

enum DragStatus {
    Success = 'success',
    None = 'none',
}

interface DragCacheEntry {
    dragInfo?: DragInfo;
    dragStatus?: DragStatus;
}

interface UseAddressesInputDrag {
    (
        recipientsOrGroups: RecipientOrGroup[],
        setRecipientsOrGroups: Dispatch<SetStateAction<RecipientOrGroup[]>>,
        onChange: (value: Recipient[]) => void
    ): {
        draggedRecipient: RecipientOrGroup | undefined;
        placeholderPosition: number | undefined;
        placeholderSize: { width: number; height: number } | undefined;
        containerDragHandlers: {
            onDragEnter: (event: DragEvent) => void;
            onDragLeave: (event: DragEvent) => void;
            onDragOver: (event: DragEvent) => void;
            onDrop: (event: DragEvent) => void;
        };
        itemDragHandlers: (recipient: RecipientOrGroup) => {
            onDragStart: (event: DragEvent) => void;
            onDragEnd: (event: DragEvent) => void;
            onDragOver: (ref: RefObject<HTMLDivElement>) => (event: DragEvent) => void;
        };
    };
}

export const useAddressesInputDrag: UseAddressesInputDrag = (recipientsOrGroups, setRecipientsOrGroups, onChange) => {
    const cache = useCache();

    const [uid] = useState(generateUID('drag-address'));
    const [draggedRecipient, setDraggedRecipient] = useState<RecipientOrGroup>();
    const [placeholderPosition, setPlaceholderPosition] = useState<number>();
    const [placeholderSize, setPlaceholderSize] = useState<{ width: number; height: number }>();

    const getCache = () => cache.get(ADDRESS_DRAG_CACHE_KEY) as DragCacheEntry | undefined;
    const setCache = (entry: DragCacheEntry) => cache.set(ADDRESS_DRAG_CACHE_KEY, entry);

    const handleContainerDrop = () => {
        const dragInfo = getCache()?.dragInfo as DragInfo;
        const draggedRecipient = dragInfo.recipient;
        const newRecipients = recipientsOrGroups.filter(
            (recipientOrGroup) => !matchRecipientOrGroup(recipientOrGroup, draggedRecipient)
        );
        newRecipients.splice(placeholderPosition as number, 0, draggedRecipient);

        setCache({ dragStatus: DragStatus.Success });
        setRecipientsOrGroups(newRecipients);
        onChange(recipientOrGroupToRecipients(newRecipients));
        setDraggedRecipient(undefined);
        setPlaceholderPosition(undefined);
    };

    const handleContainerDragLeave = () => {
        setPlaceholderPosition(undefined);
    };

    const handleContainerDragEnter = () => {
        const dragInfo = getCache()?.dragInfo as DragInfo;

        setPlaceholderPosition(0);
        setPlaceholderSize(dragInfo.size);

        setCache({ dragInfo: { ...dragInfo, inputID: uid } });
    };

    const [, containerDragHandlers] = useDragOver(
        (event) => event.dataTransfer.types.includes(DRAG_ADDRESS_KEY),
        'move',
        {
            onDragEnter: handleContainerDragEnter,
            onDragLeave: handleContainerDragLeave,
            onDrop: handleContainerDrop,
        }
    );

    const handleItemDragStart = (recipient: RecipientOrGroup) => (event: DragEvent) => {
        event.dataTransfer.setData(DRAG_ADDRESS_KEY, 'true');
        setDraggedRecipient(recipient);
        setPlaceholderPosition(recipientsOrGroups.findIndex((recipientOrGroup) => recipientOrGroup === recipient));

        // Has to be in position on drag start unless it animates to the cursor
        // After that, we want the element hidden...
        const target = event.target as HTMLElement;
        target.style.top = `${target.offsetTop}px`;
        target.style.left = `${target.offsetLeft}px`;
        setTimeout(() => {
            target.style.top = '-100000px';
            target.style.left = '-100000px';
        });

        const position = target.getBoundingClientRect();
        const size = { width: position.width, height: position.height };
        setPlaceholderSize(size);

        setCache({ dragInfo: { inputID: uid, recipient, size } });
    };

    const handleItemDragEndParsed = (dragStatus: DragStatus) => {
        if (dragStatus === DragStatus.Success && draggedRecipient !== undefined) {
            const newRecipients = recipientsOrGroups.filter(
                (recipientOrGroup) => !matchRecipientOrGroup(recipientOrGroup, draggedRecipient as RecipientOrGroup)
            );
            setRecipientsOrGroups(newRecipients);
            onChange(recipientOrGroupToRecipients(newRecipients));
        }
        setDraggedRecipient(undefined);
        setPlaceholderPosition(undefined);
    };

    const handleItemDragEnd = (event: DragEvent) => {
        const dragStatus = event.dataTransfer.dropEffect === 'move' ? DragStatus.Success : DragStatus.None;
        handleItemDragEndParsed(dragStatus);
        setCache({ dragStatus });
    };

    const handleItemDragOverThrottled = useHandler(
        (recipient: RecipientOrGroup, ref: RefObject<HTMLDivElement>, event: DragEvent) => {
            if (!ref.current) {
                return;
            }

            const recipientIndex = recipientsOrGroups.findIndex((recipientOrGroup) => recipientOrGroup === recipient);
            const refPosition = ref.current.getBoundingClientRect();
            const middleX = refPosition.left + (refPosition.right - refPosition.left) / 2;

            if (event.clientX < middleX && placeholderPosition !== recipientIndex) {
                setPlaceholderPosition(recipientIndex);
            }

            if (event.clientX >= middleX && placeholderPosition !== recipientIndex + 1) {
                setPlaceholderPosition(recipientIndex + 1);
            }
        },
        { throttle: 100 }
    );

    const handleItemDragOver =
        (recipient: RecipientOrGroup) => (ref: RefObject<HTMLDivElement>) => (event: DragEvent) =>
            handleItemDragOverThrottled(recipient, ref, event);

    const cacheListener = useHandler((changedKey) => {
        if (changedKey === ADDRESS_DRAG_CACHE_KEY && placeholderPosition !== undefined) {
            const cacheEntry = getCache();
            if (cacheEntry?.dragInfo && cacheEntry.dragInfo.inputID !== uid) {
                handleContainerDragLeave();
            }
            if (cacheEntry?.dragStatus) {
                handleItemDragEndParsed(cacheEntry.dragStatus);
            }
        }
    });

    useEffect(() => cache.subscribe(cacheListener), [cache]);

    return {
        draggedRecipient,
        placeholderPosition,
        placeholderSize,
        containerDragHandlers,
        itemDragHandlers: (recipient: RecipientOrGroup) => ({
            onDragStart: handleItemDragStart(recipient),
            onDragEnd: handleItemDragEnd,
            onDragOver: handleItemDragOver(recipient),
        }),
    };
};
