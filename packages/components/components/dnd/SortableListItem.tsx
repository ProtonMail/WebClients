import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const useSortableListItem = ({ id }: { id: string }) => {
    const { isDragging, attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return { isDragging, attributes, listeners, setNodeRef, style };
};
