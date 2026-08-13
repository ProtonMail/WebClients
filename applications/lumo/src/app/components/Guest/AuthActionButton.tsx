import React from 'react';

import { clsx } from 'clsx';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components';

import type { GuestAuthAction } from '../../hooks/useAuthActionProps';
import { useAuthActionProps } from '../../hooks/useAuthActionProps';

export interface BaseAuthProps {
    className?: string;
}

export interface AuthButtonProps extends BaseAuthProps {
    color?: 'norm' | 'weak';
    shape?: 'solid' | 'outline';
    size?: 'small' | 'medium' | 'large';
    onClick?: () => void;
}

interface AuthActionButtonProps extends AuthButtonProps {
    variant?: 'link' | 'button';
    action: GuestAuthAction;
    children?: React.ReactNode;
}

export const AuthActionButton = ({
    variant = 'link',
    action = 'signup',
    className,
    color = 'weak',
    shape = 'solid',
    size = 'medium',
    onClick,
}: AuthActionButtonProps) => {
    const { text, path, onClick: handleClick } = useAuthActionProps(action, onClick);

    if (variant === 'link') {
        return (
            <SettingsLink path={path} className={clsx('link inline-block')} onClick={handleClick}>
                {text}
            </SettingsLink>
        );
    }

    return (
        <ButtonLike
            as={SettingsLink}
            path={path}
            className={clsx(className)}
            color={color}
            shape={shape}
            size={size}
            onClick={handleClick}
        >
            {text}
        </ButtonLike>
    );
};
