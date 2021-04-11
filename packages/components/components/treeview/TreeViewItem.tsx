import React from 'react';

export interface Props {
    disabled?: boolean;
    loading?: boolean;
    content?: React.ReactNode;
    toggled?: boolean;
    focussed?: boolean;
    children?: React.ReactNode;
    onDragEnd?: () => void;
    onToggle?: () => void;
    onFocus?: () => void;
    onDragStart?: () => void;
    onDragOver?: (event: React.DragEvent) => void;
    onDrop?: () => void;
    onDrag?: () => void;
    draggable?: boolean;
    title?: string;
}

const TreeView = ({
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
    const handleClick = (event: React.MouseEvent) => {
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

export default TreeView;
