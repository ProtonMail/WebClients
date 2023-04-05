import { ComponentPropsWithoutRef, DragEvent as ReactDragEvent, ReactNode } from 'react';

import { isDragFile } from '@proton/components/components';
import { useDragOver } from '@proton/components/hooks';

import DropzoneContent from './DropzoneContent';

import './Dropzone.scss';

export type DropzoneSize = 'small' | 'medium' | 'large';
export type DropzoneShape = 'norm' | 'transparent' | 'flashy' | 'invisible';

export interface DropzoneProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onDrop'> {
    /**
     * Action to trigger when dropping files on top of the dropzone
     */
    onDrop: (files: File[]) => void;
    /**
     * Content to display when no hover
     */
    children: JSX.Element;
    /**
     * Custom content to show when dragging over the Dropzone
     */
    customContent?: ReactNode;
    /**
     * Dropzone's size : small | medium | large
     */
    size?: DropzoneSize;
    /**
     * Dropzone has a border
     */
    border?: boolean;
    /**
     * Dropzone's border is rounded
     */
    rounded?: boolean;
    /**
     * Dropzone's shade : norm | transparent | flashy | invisible
     */
    shape?: DropzoneShape;
    /**
     * Dropzone is always on dragOver state, content is always displayed
     */
    showDragOverState?: boolean;
    /**
     * Dropzone has no dragOver state, children is always displayed
     */
    disabled?: boolean;
}

const Dropzone = ({
    className,
    children,
    customContent,
    onDrop,
    disabled = false,
    showDragOverState = false,
    size = 'medium',
    rounded = true,
    border = true,
    shape = 'norm',
    ...rest
}: DropzoneProps) => {
    const handleDrop = (event: ReactDragEvent) => {
        onDrop([...event.dataTransfer.files]);
    };

    const [hovering, dragProps] = useDragOver(isDragFile, 'move', { onDrop: handleDrop });

    const isInvisible = shape === 'invisible';

    // We need to display the dropzone content when:
    // - We are on dragOver state
    // - We force to always display the dragOver state
    // BUT, we don't want to show it when:
    // - Dropzone is completely disabled
    // - The dropzone is invisible (we always show the children)
    const shouldDisplayDropzoneContent = (hovering || showDragOverState) && !disabled && !isInvisible;

    const dropzoneContent = shouldDisplayDropzoneContent && (
        <DropzoneContent
            border={border}
            className={className}
            customContent={customContent}
            rounded={rounded}
            shape={shape}
            size={size}
        />
    );

    // If invisible, we always show the children, even on dragOver state
    if (isInvisible) {
        return (
            <div className="w100 h100" {...(!disabled ? rest : undefined)} {...dragProps}>
                {children}
            </div>
        );
    }

    const canShowChildren = !!children || disabled;

    return (
        <div className="h100 w100 relative" {...(!disabled ? rest : undefined)} {...dragProps}>
            {canShowChildren && <div className="dropzone-children h100 w100">{children}</div>}
            {dropzoneContent}
        </div>
    );
};

export default Dropzone;
