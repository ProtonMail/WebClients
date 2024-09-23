import type { ElementType, ForwardedRef, HTMLAttributes, MouseEventHandler, ReactNode, RefObject } from 'react';
import { forwardRef, useEffect, useState } from 'react';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import type { DropdownButtonProps } from '@proton/components/components/dropdown/DropdownButton';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { useCombinedRefs } from '@proton/hooks';
import generateUID from '@proton/utils/generateUID';

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
    ref?: RefObject<HTMLDivElement>;
}

interface OwnProps<E extends ElementType> {
    hasCaret?: boolean;
    content?: ReactNode;
    children?: ReactNode;
    disableDefaultArrowNavigation?: boolean;
    onClick?: MouseEventHandler<E>;
    onToggle?: (isOpen: boolean) => void;
    contentProps?: ContentProps;
    autoClose?: DropdownProps['autoClose'];
    originalPlacement?: DropdownProps['originalPlacement'];
    dropdownClassName?: DropdownProps['className'];
    dropdownStyle?: DropdownProps['style'];
    dropdownSize?: DropdownProps['size'];
    forceOpen?: boolean;
}

export type Props<T extends ElementType> = DropdownButtonProps<T> & OwnProps<T>;

const SimpleDropdownBase = <E extends ElementType>(
    {
        content,
        children,
        originalPlacement,
        autoClose,
        hasCaret = true,
        dropdownClassName,
        dropdownStyle,
        contentProps,
        disableDefaultArrowNavigation = false,
        onClick,
        onToggle,
        as,
        dropdownSize,
        forceOpen,
        ...rest
    }: Props<E>,
    ref: ForwardedRef<Element>
) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>(onToggle);

    useEffect(() => {
        if (forceOpen) {
            toggle();
        }
    }, []);

    const handleClick: MouseEventHandler<E> = !!onClick
        ? (e) => {
              onClick(e);
              toggle();
          }
        : toggle;

    const Element: ElementType | undefined = as || undefined;

    return (
        <>
            <DropdownButton
                as={Element}
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
                anchorRef={anchorRef as unknown as any}
                onClose={close}
                className={dropdownClassName}
                style={dropdownStyle}
                disableDefaultArrowNavigation={disableDefaultArrowNavigation}
                size={dropdownSize}
                {...contentProps}
            >
                {children}
            </Dropdown>
        </>
    );
};

const SimpleDropdown = forwardRef(SimpleDropdownBase);

export default SimpleDropdown;
