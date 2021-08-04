import * as React from 'react';
import { classnames } from '../../helpers';
import Button from '../button/Button';
import DropdownCaret from './DropdownCaret';
import { Box, PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import { CircleLoader } from '../loader';

export interface OwnProps {
    loading?: boolean;
    caretClassName?: string;
    hasCaret?: boolean;
    isOpen?: boolean;
}

export type DropdownButtonProps<E extends React.ElementType> = PolymorphicComponentProps<E, OwnProps>;

const defaultElement = Button;

export const DropdownButton: <E extends React.ElementType = typeof defaultElement>(
    props: DropdownButtonProps<E>
) => React.ReactElement | null = React.forwardRef(
    <E extends React.ElementType = typeof defaultElement>(
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
                className={classnames([children && hasCaret ? 'flex flex-align-items-center' : '', className])}
                {...rest}
            >
                {children}
                {loading && (
                    <span className="loader-container">
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
    }
);

export default DropdownButton;
