import {
    CSSProperties,
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
import { PopperPlacement, usePopperAnchor } from '../popper';
import Dropdown from './Dropdown';
import DropdownButton, { DropdownButtonProps } from './DropdownButton';

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
    ref?: RefObject<HTMLDivElement>;
}

interface OwnProps<E extends ElementType> {
    hasCaret?: boolean;
    content?: ReactNode;
    children?: ReactNode;
    originalPlacement?: PopperPlacement;
    autoClose?: boolean;
    dropdownClassName?: string;
    dropdownStyle?: CSSProperties;
    disableDefaultArrowNavigation?: boolean;
    onClick?: MouseEventHandler<E>;
    onToggle?: (isOpen: boolean) => void;
    contentProps?: ContentProps;
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
            >
                {children}
            </Dropdown>
        </>
    );
};

const SimpleDropdown = forwardRef(SimpleDropdownBase);

export default SimpleDropdown;
