import type { DragEvent, MouseEvent, ReactNode } from 'react';

export interface Props {
    disabled?: boolean;
    loading?: boolean;
    content?: ReactNode;
    toggled?: boolean;
    focussed?: boolean;
    children?: ReactNode;
    onDragEnd?: () => void;
    onToggle?: () => void;
    onFocus?: () => void;
    onDragStart?: () => void;
    onDragOver?: (event: DragEvent) => void;
    onDrop?: () => void;
    onDrag?: () => void;
    draggable?: boolean;
    title?: string;
}

const TreeViewItem = ({
    draggable = false,
    onDragEnd,
    onDragStart,
    onDragOver,
    onDrop,
    onDrag,
    disabled,
    content,
    toggled = false,
    focussed = false,
    children,
    onToggle,
    onFocus,
    title,
}: Props) => {
    const handleClick = (event: MouseEvent) => {
        event.stopPropagation();

        if (disabled) {
            return;
        }

        onToggle?.();
    };

    return (
        <li
            title={title}
            role={children ? 'treeitem' : 'none'}
            tabIndex={focussed ? 0 : -1}
            onClick={handleClick}
            onFocus={onFocus}
            aria-expanded={toggled}
            className="treeview-item"
        >
            <div
                className="treeview-content"
                draggable={!disabled && draggable}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDrag={onDrag}
            >
                {content}
            </div>
            {toggled ? children : null}
        </li>
    );
};

export default TreeViewItem;
