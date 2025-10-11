import type { ElementType } from 'react';
import { forwardRef } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { PolymorphicForwardRefExoticComponent, PolymorphicPropsWithRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

import DropdownCaret from './DropdownCaret';

interface OwnProps {
    loading?: boolean;
    caretClassName?: string;
    hasCaret?: boolean;
    isOpen?: boolean;
}

export type DropdownButtonProps<E extends ElementType> = PolymorphicPropsWithRef<OwnProps, E>;

const defaultElement = Button;

const DropdownButtonBase = <E extends ElementType = typeof defaultElement>(
    {
        children,
        className,
        hasCaret = false,
        isOpen = false,
        caretClassName = '',
        loading = false,
        disabled,
        as,
        ...rest
    }: DropdownButtonProps<E>,
    ref: typeof rest.ref
) => {
    const Element: ElementType = as || defaultElement;
    return (
        <Element
            ref={ref}
            aria-expanded={isOpen}
            aria-busy={loading}
            disabled={loading ? true : disabled}
            data-testid="dropdown-button"
            className={clsx(children && hasCaret && 'flex items-center flex-nowrap', 'text-nowrap', className)}
            {...rest}
        >
            {children}
            {loading && (
                <span className="button-loader-container">
                    <CircleLoader />
                </span>
            )}
            {hasCaret && (
                <DropdownCaret
                    className={clsx(['shrink-0', children ? ' ml-1' : '', caretClassName])}
                    isOpen={isOpen}
                />
            )}
        </Element>
    );
};

const DropdownButton: PolymorphicForwardRefExoticComponent<OwnProps, typeof defaultElement> =
    forwardRef(DropdownButtonBase);

export default DropdownButton;
