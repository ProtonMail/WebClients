import { CSSProperties, ElementType, MouseEventHandler, ReactNode, forwardRef, useState } from 'react';

import { useCombinedRefs } from '@proton/hooks';

import { generateUID } from '../../helpers';
import { PopperPlacement, usePopperAnchor } from '../popper';
import Dropdown from './Dropdown';
import DropdownButton, { DropdownButtonProps } from './DropdownButton';

interface OwnProps {
    hasCaret?: boolean;
    content?: ReactNode;
    children?: ReactNode;
    originalPlacement?: PopperPlacement;
    autoClose?: boolean;
    dropdownClassName?: string;
    dropdownStyle?: CSSProperties;
    disableDefaultArrowNavigation?: boolean;
    onClick?: MouseEventHandler;
    onToggle?: (isOpen: boolean) => void;
}

export type Props<T extends ElementType> = DropdownButtonProps<T> & OwnProps;

const SimpleDropdownBase = <E extends ElementType>(
    {
        content,
        children,
        originalPlacement,
        autoClose,
        hasCaret = true,
        dropdownClassName,
        dropdownStyle,
        disableDefaultArrowNavigation = false,
        onClick,
        onToggle,
        ...rest
    }: Props<E>,
    ref: typeof rest.ref
) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>(onToggle);

    const handleClick: MouseEventHandler<HTMLButtonElement> = !!onClick
        ? (e) => {
              onClick(e);
              toggle();
          }
        : toggle;

    return (
        <>
            <DropdownButton
                {...rest}
                ref={useCombinedRefs(ref, anchorRef)}
                isOpen={isOpen}
                onClick={handleClick}
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
};

const SimpleDropdown = forwardRef(SimpleDropdownBase);

export default SimpleDropdown;
