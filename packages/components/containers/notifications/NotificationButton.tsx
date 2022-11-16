import { ElementType, ReactElement, forwardRef, useContext } from 'react';
import { PolymorphicComponentProps } from 'react-polymorphic-box';

import { ButtonLike, ButtonLikeProps } from '@proton/atoms';
import NotificationContext from '@proton/components/containers/notifications/notificationContext';

import Icon from '../../components/icon/Icon';
import { classnames } from '../../helpers';

interface NotificationOwnProps {
    close?: boolean;
}

export type NotificationButtonProps<E extends ElementType> = PolymorphicComponentProps<
    E,
    NotificationOwnProps & Omit<ButtonLikeProps<E>, 'shape' | 'color' | 'size'>
>;
const defaultElement = 'button';

const NotificationButtonBase = <E extends ElementType = typeof defaultElement>(
    { close, className = '', ...rest }: NotificationButtonProps<E>,
    ref: typeof rest.ref
) => {
    const { type } = useContext(NotificationContext);
    const positive = type == 'info' || type == 'success';
    return (
        <ButtonLike
            as={defaultElement}
            {...(!rest.as || rest.as === 'button' ? { type: 'button' } : undefined)}
            ref={ref}
            {...rest}
            shape={positive ? 'ghost' : 'solid'}
            color={positive ? 'weak' : 'danger'}
            size="small"
            className={classnames(['notification__button text-bold', close && 'notification__close-button', className])}
        />
    );
};

const NotificationButton: <E extends ElementType = typeof defaultElement>(
    props: NotificationButtonProps<E>
) => ReactElement | null = forwardRef(NotificationButtonBase);

export const NotificationCloseButton = ({ onClick }: { onClick?: () => void }) => {
    return (
        <NotificationButton icon onClick={onClick} close>
            <Icon name="cross" />
        </NotificationButton>
    );
};

export default NotificationButton;
