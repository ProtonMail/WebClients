import React, { useState } from 'react';
import Dropdown from './Dropdown';
import { usePopperAnchor } from '../popper';
import DropdownButton, { DropdownButtonProps } from './DropdownButton';
import { generateUID } from '../../helpers';
import { useCombinedRefs } from '../../hooks';

interface OwnProps {
    hasCaret?: boolean;
    content?: React.ReactNode;
    children?: React.ReactNode;
    originalPlacement?: string;
    autoClose?: boolean;
    dropdownClassName?: string;
    dropdownStyle?: React.CSSProperties;
}

export type Props<T extends React.ElementType> = OwnProps & DropdownButtonProps<T>;

const SimpleDropdown = React.forwardRef(
    <E extends React.ElementType>(
        {
            content,
            children,
            originalPlacement,
            autoClose,
            hasCaret = true,
            dropdownClassName,
            dropdownStyle,
            ...rest
        }: Props<E>,
        ref: typeof rest.ref
    ) => {
        const [uid] = useState(generateUID('dropdown'));

        const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

        return (
            <>
                <DropdownButton
                    {...rest}
                    ref={useCombinedRefs(ref, anchorRef)}
                    isOpen={isOpen}
                    onClick={toggle}
                    hasCaret={hasCaret}
                >
                    {content}
                </DropdownButton>
                <Dropdown
                    id={uid}
                    originalPlacement={originalPlacement}
                    autoClose={autoClose}
                    isOpen={isOpen}
                    anchorRef={anchorRef}
                    onClose={close}
                    className={dropdownClassName}
                    style={dropdownStyle}
                >
                    {children}
                </Dropdown>
            </>
        );
    }
);

export default SimpleDropdown;
