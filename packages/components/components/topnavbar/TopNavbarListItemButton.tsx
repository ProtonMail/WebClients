import { ElementType, ForwardedRef, ReactElement, cloneElement, forwardRef } from 'react';
import { PolymorphicPropsWithRef } from 'react-polymorphic-types';

import { c } from 'ttag';

import { ButtonLike, ButtonLikeProps, NotificationDot } from '@proton/atoms';
import { ThemeColor } from '@proton/colors/types';
import clsx from '@proton/utils/clsx';

type ButtonButtonLikeProps = ButtonLikeProps<'button'>;

interface OwnProps {
    color?: ButtonButtonLikeProps['color'];
    shape?: ButtonButtonLikeProps['shape'];
    icon: ReactElement;
    text: string;
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
                'topnav-link inline-flex flex-nowrap flex-align-items-center relative',
                className,
                notificationDotColor && 'topnav-link--notification',
            ])}
            disabled={isDisabled}
            tabIndex={isDisabled ? -1 : tabIndex}
            ref={ref}
            {...rest}
        >
            {cloneElement(icon, {
                className: clsx([icon.props.className, 'topnav-icon mr-2']),
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

const TopNavbarListItemButton: <E extends ElementType = typeof defaultElement>(
    props: TopNavbarListItemButtonProps<E>
) => ReactElement | null = forwardRef(TopNavbarListItemButtonBase);

export default TopNavbarListItemButton;
