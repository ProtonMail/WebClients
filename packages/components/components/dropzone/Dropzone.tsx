import type { ComponentPropsWithoutRef, DragEvent as ReactDragEvent, ReactNode } from 'react';
import { cloneElement } from 'react';

import DropzoneContent from '@proton/components/components/dropzone/DropzoneContent';
import { isDragFile } from '@proton/components/components/dropzone/helpers';
import { useDragOver } from '@proton/components/hooks';

import './Dropzone.scss';

export type DropzoneSize = 'small' | 'medium' | 'large';
export type DropzoneShape = 'norm' | 'transparent' | 'flashy' | 'white' | 'invisible';

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
     * Dropzone's shade : norm | transparent | flashy | white | invisible
     */
    shape?: DropzoneShape;
    /**
     * Dropzone is always on dragOver state, content is always displayed
     */
    showDragOverState?: boolean;
    /**
     * Dropzone has no dragOver state, and onDrop cannot be triggered
     */
    disabled?: boolean;
    /**
     * Prevents setting the Dropzone's children div to position "relative"
     */
    isStatic?: boolean;
    /**
     * Title displayed under the illustration in "large" Dropzones (without custom content). Default text is "Drop to import"
     */
    contentTitle?: string;
    /**
     * Sub text displayed under the illustration in Dropzones (without custom content).
     * Default text is "Drop file here to upload" for "small" and "medium" Dropzones,
     * and "Your files will be encrypted and then saved" for "large" Dropzones
     */
    contentSubText?: string;
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
    isStatic = false,
    contentTitle,
    contentSubText,
    ...rest
}: DropzoneProps) => {
    const handleDrop = (event: ReactDragEvent) => {
        if (!disabled) {
            onDrop([...event.dataTransfer.files]);
        }
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

    const dropzoneContent = shouldDisplayDropzoneContent ? (
        <DropzoneContent
            border={border}
            className={className}
            customContent={customContent}
            rounded={rounded}
            shape={shape}
            size={size}
            contentTitle={contentTitle}
            contentSubText={contentSubText}
        />
    ) : null;

    /**
     * Warning:
     * To display this dropzone we had two solutions
     * 1. Add a container, wrapping the child and the content
     * 2. Clone the element and update some props
     *
     * The first solution is easier to implement and to use, however in some cases (mostly CSS), adding this container could break the UI
     * The developer would then need to do tricky CSS manipulation in order to get a working dropzone.
     *
     * To avoid having a container div which would contain the children and the content, we clone the children element.
     * However, the Dropzone children might need some configuration to work properly:
     * Because we're adding the dropzone content as a new children, and we're adding some props to the children element,
     * you'll need to spread the rest operator in the wrapping div AND render the children.
     */
    return cloneElement(children, {
        ...children.props,
        ...dragProps,
        ...rest,
        style:
            shouldDisplayDropzoneContent && !isStatic
                ? { position: 'relative', ...children.props.style }
                : { ...children.props.style },
        children: (
            <>
                {children.props.children}
                {dropzoneContent}
            </>
        ),
    });
};

export default Dropzone;
