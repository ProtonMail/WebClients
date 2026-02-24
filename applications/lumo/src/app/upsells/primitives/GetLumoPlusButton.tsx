import React from 'react';

import type { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import clsx from '@proton/utils/clsx';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import { GetLumoPlusContent } from './GetLumoPlusContent';

interface GetLumoPlusButtonProps extends PromotionButtonProps<typeof ButtonLike> {
    className?: string;
    path?: string;
    onClick?: () => void;
    callToActionText?: string;
}

/**
 * Promotion button with gradient and "Get Lumo+" content
 * Used for main CTAs in headers, modals, etc.
 * Supports both path navigation (via SettingsLink) and onClick handlers
 */
const GetLumoPlusButton = ({ className, path, onClick, callToActionText, ...props }: GetLumoPlusButtonProps) => {
    const baseClassName = clsx(`shrink-0 upsell-addon-button button-promotion`, LUMO_UPGRADE_TRIGGER_CLASS, className);
    const baseProps = {
        buttonGradient: true,
        size: 'medium' as const,
        ...props,
    };

    // If path is provided, use SettingsLink for navigation
    if (path) {
        return (
            <PromotionButton as={SettingsLink} path={path} className={baseClassName} {...baseProps}>
                <GetLumoPlusContent customText={callToActionText} />
            </PromotionButton>
        );
    }

    // Otherwise, use regular button with onClick
    return (
        <PromotionButton as="button" onClick={onClick} className={baseClassName} {...baseProps}>
            <GetLumoPlusContent customText={callToActionText} />
        </PromotionButton>
    );
};

export default GetLumoPlusButton;
