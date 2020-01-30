import React from 'react';

export interface NodeTreeView {
    role?: string;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    name: React.ReactNode;
    toggled?: boolean;
    focussed?: boolean;
    children?: React.ReactNode;
    onToggle?: () => void;
    onFocus?: () => void;
    onDragStart?: () => void;
    onDragOver?: () => void;
    onDrop?: () => void;
    onDrag?: () => void;
    draggable?: boolean;
    className?: string;
}

const TreeView = ({
    draggable = false,
    role = 'tree',
    onDragStart,
    onDragOver,
    onDrop,
    onDrag,
    disabled,
    icon,
    name,
    toggled = false,
    focussed = false,
    children,
    onToggle,
    onFocus,
    className
}: NodeTreeView) => {
    const handleClick = (event: React.MouseEvent) => {
        event.stopPropagation();

        if (disabled) {
            return;
        }

        onToggle && onToggle();
    };

    return (
        <ul role={role}>
            <li
                draggable={!disabled && draggable}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDrag={onDrag}
                role={children ? 'treeitem' : 'none'}
                tabIndex={focussed ? 0 : -1}
                onClick={handleClick}
                onFocus={onFocus}
                aria-expended={toggled}
                className={className}
            >
                {icon}
                {name}
                {toggled ? children : null}
            </li>
        </ul>
    );
};

export default TreeView;
