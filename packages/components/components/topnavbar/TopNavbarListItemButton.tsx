import React from 'react';

import { classnames } from '../../helpers';
import { Box, PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';

interface OwnProps {
    icon: React.ReactElement;
    text: string;
    hasRedDot?: boolean;
}

export type TopNavbarListItemButtonProps<E extends React.ElementType> = PolymorphicComponentProps<E, OwnProps>;

const defaultElement = 'button';

const TopNavbarListItemButton: <E extends React.ElementType = typeof defaultElement>(
    props: TopNavbarListItemButtonProps<E>
) => React.ReactElement | null = React.forwardRef(
    <E extends React.ElementType = typeof defaultElement>(
        { text, icon, disabled, className, hasRedDot, tabIndex, children, ...rest }: TopNavbarListItemButtonProps<E>,
        ref: typeof rest.ref
    ) => {
        const isDisabled = disabled;

        return (
            <Box
                className={classnames([
                    'topnav-link inline-flex flex-nowrap flex-align-items-center',
                    hasRedDot && 'relative topnav-link--blackfriday',
                    className,
                ])}
                disabled={isDisabled}
                tabIndex={isDisabled ? -1 : tabIndex}
                ref={ref}
                {...rest}
            >
                {React.cloneElement(icon, {
                    className: classnames([icon.props.className, 'topnav-icon mr0-5']),
                })}
                <span className="navigation-title">{text}</span>
                {children}
            </Box>
        );
    }
);

export default TopNavbarListItemButton;
