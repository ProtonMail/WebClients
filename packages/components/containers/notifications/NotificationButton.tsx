import type { ElementType, ForwardedRef } from 'react';
import { forwardRef, useContext } from 'react';

import type { ButtonLikeOwnProps, ButtonLikeProps } from '@proton/atoms';
import { ButtonLike } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import NotificationContext from '@proton/components/containers/notifications/notificationContext';
import type { PolymorphicForwardRefExoticComponent, PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

type ButtonPropsFilter<T> = Omit<T, 'shape' | 'color' | 'size'>;
type NotificationOwnProps = { close?: boolean } & ButtonPropsFilter<ButtonLikeOwnProps>;

export type NotificationButtonProps<E extends ElementType> = PolymorphicPropsWithoutRef<
    ButtonPropsFilter<ButtonLikeProps<E>>,
    E
>;

const defaultElement = 'button';

const NotificationButtonBase = <E extends ElementType = typeof defaultElement>(
    { close, className = '', as, ...rest }: NotificationButtonProps<E>,
    ref: ForwardedRef<Element>
) => {
    const { type } = useContext(NotificationContext);
    const positive = type == 'info' || type == 'success';
    const Element: ElementType = as || defaultElement;
    return (
        <ButtonLike
            as={Element}
            {...(Element === 'button' ? { type: 'button' } : undefined)}
            ref={ref}
            {...rest}
            shape={positive ? 'ghost' : 'solid'}
            color={positive ? 'weak' : 'danger'}
            size="small"
            className={clsx(['notification__button text-bold', close && 'notification__close-button', className])}
            data-testid="notification:undo-button"
        />
    );
};

const NotificationButton: PolymorphicForwardRefExoticComponent<NotificationOwnProps, typeof defaultElement> =
    forwardRef(NotificationButtonBase);

export const NotificationCloseButton = ({ onClick }: { onClick?: () => void }) => {
    return (
        <NotificationButton icon onClick={onClick} close>
            <Icon name="cross-big" data-testid="notification:close-button" />
        </NotificationButton>
    );
};

export default NotificationButton;
