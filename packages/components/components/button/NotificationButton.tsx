import { Ref, forwardRef } from 'react';

import { Button, ButtonProps } from '@proton/atoms';

import { classnames } from '../../helpers';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

interface NotificationButtonProps extends Omit<ButtonProps, 'shape' | 'color' | 'size'> {
    notificationType?: NotificationType;
}

const NotificationButton = (
    { notificationType = 'info', className = '', ...rest }: NotificationButtonProps,
    ref: Ref<HTMLButtonElement>
) => {
    return (
        <Button
            shape={notificationType == 'info' || notificationType == 'success' ? 'ghost' : 'solid'}
            color={notificationType == 'info' || notificationType == 'success' ? 'weak' : 'danger'}
            size="small"
            className={classnames(['notification__button text-bold', className])}
            ref={ref}
            {...rest}
        />
    );
};

export default forwardRef<HTMLButtonElement, NotificationButtonProps>(NotificationButton);
