import { ElementType, ForwardedRef, ReactElement, forwardRef, useContext } from 'react';

import { ButtonLike, ButtonLikeProps } from '@proton/atoms';
import NotificationContext from '@proton/components/containers/notifications/notificationContext';
import clsx from '@proton/utils/clsx';

import Icon from '../../components/icon/Icon';

interface NotificationOwnProps {
    close?: boolean;
}

export type NotificationButtonProps<E extends ElementType> = Omit<ButtonLikeProps<E>, 'shape' | 'color' | 'size'> &
    NotificationOwnProps;
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

const NotificationButton: <E extends ElementType = typeof defaultElement>(
    props: NotificationButtonProps<E>
) => ReactElement | null = forwardRef(NotificationButtonBase);

export const NotificationCloseButton = ({ onClick }: { onClick?: () => void }) => {
    return (
        <NotificationButton icon onClick={onClick} close>
            <Icon name="cross-big" />
        </NotificationButton>
    );
};

export default NotificationButton;
