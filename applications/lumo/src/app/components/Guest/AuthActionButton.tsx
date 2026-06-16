import React, { useCallback } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components';

import { useGuestMigration } from '../../hooks/useGuestMigration';
import { useLumoAuthAction } from '../../hooks/useLumoAuthAction';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';

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
    action: 'signup' | 'signin';
    children?: React.ReactNode;
}

const AUTH_ACTIONS = {
    signup: {
        getButtonText: () => c('collider_2025: Link').t`Create a free account`,
        path: '/signup',
    },
    signin: {
        getButtonText: () => c('collider_2025: Link').t`Sign in`,
        path: '',
    },
};

export const AuthActionButton = ({
    variant = 'link',
    action = 'signup',
    className,
    color = 'weak',
    shape = 'solid',
    size = 'medium',
    onClick,
}: AuthActionButtonProps) => {
    const config = AUTH_ACTIONS[action];

    const { captureGuestState } = useGuestMigration();
    const { isEnabled: isNativeAuthEnabled, trigger: triggerAuthAction } = useLumoAuthAction();

    const handleClick = useCallback(
        async (event: React.MouseEvent) => {
            if (isNativeAuthEnabled) {
                event.preventDefault();
            }
            onClick?.();
            setNativeComposerVisibility(false);
            try {
                const captured = await captureGuestState();
                if (captured) {
                    console.log('Guest state captured and encrypted from header sign-up');
                }
            } catch (error) {
                console.error('Failed to capture guest state:', error);
            }
            if (isNativeAuthEnabled) {
                triggerAuthAction(action);
            }
        },
        [captureGuestState, onClick, isNativeAuthEnabled, triggerAuthAction, action]
    );

    const text = config.getButtonText();
    const path = isNativeAuthEnabled ? '' : config.path;

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
