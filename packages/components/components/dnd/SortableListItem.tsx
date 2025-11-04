import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const useSortableListItem = (props: Parameters<typeof useSortable>[0]) => {
    const { isDragging, attributes, listeners, setNodeRef, transform, transition } = useSortable(props);

    const style = {
        transform: CSS.Transform.toString(
            transform
                ? {
                      x: transform.x,
                      y: transform.y,
                      // Not interested in scaling the item to the new item. Better to keep it in case they have differing heights.
                      scaleX: 1,
                      scaleY: 1,
                  }
                : null
        ),
        transition,
    };

    return { isDragging, attributes, listeners, setNodeRef, style };
};
