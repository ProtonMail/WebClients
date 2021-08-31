import { CSSProperties, ElementType, forwardRef, ReactNode, useState } from 'react';
import Dropdown from './Dropdown';
import { usePopperAnchor } from '../popper';
import DropdownButton, { DropdownButtonProps } from './DropdownButton';
import { generateUID } from '../../helpers';
import { useCombinedRefs } from '../../hooks';

interface OwnProps {
    hasCaret?: boolean;
    content?: ReactNode;
    children?: ReactNode;
    originalPlacement?: string;
    autoClose?: boolean;
    dropdownClassName?: string;
    dropdownStyle?: CSSProperties;
    disableDefaultArrowNavigation?: boolean;
}

export type Props<T extends ElementType> = OwnProps & DropdownButtonProps<T>;

const SimpleDropdown = forwardRef(
    <E extends ElementType>(
        {
            content,
            children,
            originalPlacement,
            autoClose,
            hasCaret = true,
            dropdownClassName,
            dropdownStyle,
            disableDefaultArrowNavigation = false,
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
                    disableDefaultArrowNavigation={disableDefaultArrowNavigation}
                >
                    {children}
                </Dropdown>
            </>
        );
    }
);

export default SimpleDropdown;
