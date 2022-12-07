import { ElementType, ReactElement, forwardRef } from 'react';

import { Button, CircleLoader } from '@proton/atoms';

import { classnames } from '../../helpers';
import { Box, PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import DropdownCaret from './DropdownCaret';

interface OwnProps {
    loading?: boolean;
    caretClassName?: string;
    hasCaret?: boolean;
    isOpen?: boolean;
}

export type DropdownButtonProps<E extends ElementType> = PolymorphicComponentProps<E, OwnProps>;

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
        ...rest
    }: DropdownButtonProps<E>,
    ref: typeof rest.ref
) => {
    return (
        <Box
            as={defaultElement}
            ref={ref}
            aria-expanded={isOpen}
            aria-busy={loading}
            disabled={loading ? true : disabled}
            data-testid="dropdown-button"
            className={classnames([children && hasCaret && 'flex flex-align-items-center flex-nowrap', className])}
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
                    className={classnames(['flex-item-noshrink', children ? 'ml0-5' : '', caretClassName])}
                    isOpen={isOpen}
                />
            )}
        </Box>
    );
};

const DropdownButton: <E extends ElementType = typeof defaultElement>(
    props: DropdownButtonProps<E>
) => ReactElement | null = forwardRef(DropdownButtonBase);

export default DropdownButton;
