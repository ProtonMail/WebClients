import {
    ElementType,
    ForwardedRef,
    HTMLAttributes,
    MouseEventHandler,
    ReactNode,
    RefObject,
    forwardRef,
    useState,
} from 'react';

import { useCombinedRefs } from '@proton/hooks';

import { generateUID } from '../../helpers';
import { usePopperAnchor } from '../popper';
import Dropdown, { DropdownProps } from './Dropdown';
import DropdownButton, { DropdownButtonProps } from './DropdownButton';

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
        ...rest
    }: Props<E>,
    ref: ForwardedRef<Element>
) => {
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>(onToggle);

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
                contentProps={contentProps}
                size={dropdownSize}
            >
                {children}
            </Dropdown>
        </>
    );
};

const SimpleDropdown = forwardRef(SimpleDropdownBase);

export default SimpleDropdown;
