import { useState, DragEvent, RefObject, Dispatch, SetStateAction } from 'react';
import { useHandler } from 'react-components';
import { Recipient } from 'proton-shared/lib/interfaces';

import { RecipientOrGroup } from '../models/address';
import { DRAG_ADDRESS_KEY, DRAG_ADDRESS_SIZE_KEY } from '../constants';
import { matchRecipientOrGroup, recipientOrGroupToRecipients } from '../helpers/addresses';
import { useDragOver } from './useDragOver';

interface UseAddressesInputDrag {
    (
        recipientsOrGroups: RecipientOrGroup[],
        setRecipientsOrGroups: Dispatch<SetStateAction<RecipientOrGroup[]>>,
        onChange: (value: Partial<Recipient>[]) => void
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
        itemDragHandlers: (
            recipient: RecipientOrGroup
        ) => {
            onDragStart: (event: DragEvent) => void;
            onDragEnd: (event: DragEvent) => void;
            onDragOver: (ref: RefObject<HTMLDivElement>) => (event: DragEvent) => void;
        };
    };
}

export const useAddressesInputDrag: UseAddressesInputDrag = (recipientsOrGroups, setRecipientsOrGroups, onChange) => {
    const [draggedRecipient, setDraggedRecipient] = useState<RecipientOrGroup>();
    const [placeholderPosition, setPlaceholderPosition] = useState<number>();
    const [placeholderSize, setPlaceholderSize] = useState<{ width: number; height: number }>();

    const handleContainerDrop = (event: DragEvent) => {
        const draggedRecipient = JSON.parse(event.dataTransfer.getData(DRAG_ADDRESS_KEY)) as RecipientOrGroup;
        const newRecipients = recipientsOrGroups.filter(
            (recipientOrGroup) => !matchRecipientOrGroup(recipientOrGroup, draggedRecipient)
        );
        newRecipients.splice(placeholderPosition as number, 0, draggedRecipient);

        setRecipientsOrGroups(newRecipients);
        onChange(recipientOrGroupToRecipients(newRecipients));
        setDraggedRecipient(undefined);
        setPlaceholderPosition(undefined);
    };

    const handleContainerDragLeave = () => {
        setPlaceholderPosition(undefined);
    };

    const handleContainerDragEnter = (event: DragEvent) => {
        const size = JSON.parse(event.dataTransfer.getData(DRAG_ADDRESS_SIZE_KEY)) as { width: number; height: number };
        setPlaceholderPosition(0);
        setPlaceholderSize(size);
    };

    const [, containerDragHandlers] = useDragOver(
        (event) => event.dataTransfer.types.includes(DRAG_ADDRESS_KEY),
        'move',
        {
            onDragEnter: handleContainerDragEnter,
            onDragLeave: handleContainerDragLeave,
            onDrop: handleContainerDrop
        }
    );

    const handleItemDragStart = (recipient: RecipientOrGroup) => (event: DragEvent) => {
        event.dataTransfer.setData(DRAG_ADDRESS_KEY, JSON.stringify(recipient));
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
        event.dataTransfer.setData(DRAG_ADDRESS_SIZE_KEY, JSON.stringify(size));
    };

    const handleItemDragEnd = (event: DragEvent) => {
        if (
            event.dataTransfer.dropEffect === 'move' &&
            draggedRecipient !== undefined &&
            placeholderPosition === undefined
        ) {
            const newRecipients = recipientsOrGroups.filter(
                (recipientOrGroup) => !matchRecipientOrGroup(recipientOrGroup, draggedRecipient as RecipientOrGroup)
            );
            setRecipientsOrGroups(newRecipients);
            onChange(recipientOrGroupToRecipients(newRecipients));
        }
        setDraggedRecipient(undefined);
        setPlaceholderPosition(undefined);
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

    const handleItemDragOver = (recipient: RecipientOrGroup) => (ref: RefObject<HTMLDivElement>) => (
        event: DragEvent
    ) => handleItemDragOverThrottled(recipient, ref, event);

    return {
        draggedRecipient,
        placeholderPosition,
        placeholderSize,
        containerDragHandlers,
        itemDragHandlers: (recipient: RecipientOrGroup) => ({
            onDragStart: handleItemDragStart(recipient),
            onDragEnd: handleItemDragEnd,
            onDragOver: handleItemDragOver(recipient)
        })
    };
};
