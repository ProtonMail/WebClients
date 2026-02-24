import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton';
import clsx from '@proton/utils/clsx';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';

interface BasicUpgradeButtonProps extends PromotionButtonProps<typeof ButtonLike> {
    // responsive?: boolean;
    className?: string;
    buttonText?: string;
    path?: string;
    onClick?: () => void;
}

/**
 * Basic Upgrade button
 * Used for main CTAs in error components
 * Supports both path navigation (via SettingsLink) and onClick handlers
 */
const BasicUpgradeButton = ({ className, buttonText, path, onClick, ...props }: BasicUpgradeButtonProps) => {
    const content = buttonText || c('collider_2025: Link').t`Upgrade`;
    const baseClassName = clsx(`shrink-0`, LUMO_UPGRADE_TRIGGER_CLASS, className);
    const baseProps = {
        shape: 'solid' as const,
        color: 'norm' as const,
        size: 'medium' as const,
        ...props,
    };

    // If path is provided, use SettingsLink for navigation
    if (path) {
        return (
            <ButtonLike as={SettingsLink} path={path} className={baseClassName} {...baseProps}>
                {content}
            </ButtonLike>
        );
    }

    // Otherwise, use regular button with onClick
    return (
        <ButtonLike as="button" onClick={onClick} className={baseClassName} {...baseProps}>
            {content}
        </ButtonLike>
    );
};

export default BasicUpgradeButton;
