import type { ElementType, ForwardedRef, ReactElement } from 'react';
import { cloneElement, forwardRef } from 'react';

import { c } from 'ttag';

import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import type { ThemeColor } from '@proton/colors/types';
import type { PolymorphicForwardRefExoticComponent, PolymorphicPropsWithRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

type ButtonButtonLikeProps = ButtonLikeProps<'button'>;

interface OwnProps {
    color?: ButtonButtonLikeProps['color'];
    shape?: ButtonButtonLikeProps['shape'];
    icon?: ReactElement;
    text?: string;
    notificationDotColor?: ThemeColor;
}

export type TopNavbarListItemButtonProps<E extends ElementType> = PolymorphicPropsWithRef<OwnProps, E>;

const defaultElement = 'button';

const TopNavbarListItemButtonBase = <E extends ElementType = typeof defaultElement>(
    {
        color = 'weak',
        shape = 'ghost',
        text,
        icon,
        disabled,
        className,
        notificationDotColor,
        tabIndex,
        children,
        as,
        ...rest
    }: TopNavbarListItemButtonProps<E>,
    ref: ForwardedRef<Element>
) => {
    const isDisabled = disabled;
    const Element: ElementType = as || defaultElement;

    return (
        <ButtonLike
            as={Element}
            color={color}
            shape={shape}
            className={clsx([
                'topnav-link inline-flex flex-nowrap items-center shrink-0 relative',
                className,
                notificationDotColor && 'topnav-link--notification',
            ])}
            disabled={isDisabled}
            tabIndex={isDisabled ? -1 : tabIndex}
            ref={ref}
            {...rest}
        >
            {icon &&
                cloneElement(icon, {
                    className: clsx([icon.props.className, 'topnav-icon mr-2 shrink-0']),
                })}
            <span className="navigation-title">{text}</span>
            {notificationDotColor && (
                <NotificationDot
                    className="ml-1"
                    color={notificationDotColor}
                    alt={c('Action').t`Attention required`}
                />
            )}
            {children}
        </ButtonLike>
    );
};

const TopNavbarListItemButton: PolymorphicForwardRefExoticComponent<OwnProps, typeof defaultElement> =
    forwardRef(TopNavbarListItemButtonBase);

export default TopNavbarListItemButton;
