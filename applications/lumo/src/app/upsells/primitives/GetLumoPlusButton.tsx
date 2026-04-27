import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components';
import type { PromotionButtonProps } from '@proton/components/components/button/PromotionButton';
import clsx from '@proton/utils/clsx';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import { UpgradeToLumoPlusContent } from './GetLumoPlusContent';

import './GetLumoPlusButton.scss';

interface GetLumoPlusButtonProps extends PromotionButtonProps<typeof ButtonLike> {
    className?: string;
    path?: string;
    onClick?: () => void;
    callToActionText?: string;
}

/**
 * Used for main CTAs in headers, modals, etc.
 * Supports both path navigation (via SettingsLink) and onClick handlers
 */
const UpgradeToLumoPlusButton = ({ className, path, onClick, callToActionText, ...props }: GetLumoPlusButtonProps) => {
    const baseClassName = clsx(
        `shrink-0 upsell-addon-button lumo-plus-upgrade-button`,
        LUMO_UPGRADE_TRIGGER_CLASS,
        className
    );
    const baseProps = {
        size: 'medium' as const,
        shape: 'ghost' as const,
        ...props,
    };

    // If path is provided, use SettingsLink for navigation
    if (path) {
        return (
            <ButtonLike as={SettingsLink} path={path} className={baseClassName} {...baseProps}>
                <UpgradeToLumoPlusContent />
            </ButtonLike>
        );
    }

    // Otherwise, use regular button with onClick
    return (
        <Button onClick={onClick} className={baseClassName} {...baseProps}>
            <UpgradeToLumoPlusContent />
        </Button>
    );
};

export default UpgradeToLumoPlusButton;
