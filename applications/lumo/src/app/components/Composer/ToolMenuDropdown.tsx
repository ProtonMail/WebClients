import { useCallback } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import type { IconName } from '@proton/icons/types';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { useLumoDispatch } from '../../redux/hooks';
import { openAgentPicker } from '../../redux/slices/composerActions';
import { isLimitExhausted, useRemainingLimits } from '../../services/usageLimitsStore';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';
import BasicUpgradeButton from '../../upsells/primitives/BasicUpgradeButton';
import { sendUpgradeButtonClickedEvent } from '../../util/telemetry';
import { MenuDropdown, type MenuDropdownProps, MenuItem } from './components/MenuDropdown';

import './ToolMenuDropdown.scss';

interface ToolMenuDropdownProps extends Pick<MenuDropdownProps, 'isOpen' | 'anchorRef' | 'onClose'> {
    onClickCreateImageOption: () => void;
    canUseAgents?: boolean;
}

export const ToolMenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    onClickCreateImageOption,
    canUseAgents = false,
}: ToolMenuDropdownProps) => {
    const { isWebSearchButtonToggled, handleWebSearchButtonClick } = useWebSearch();
    const isGuest = useIsGuest();
    const { imageTools: isImageToolsFlagEnabled, customAgents: isCustomAgentsFlagEnabled } = useLumoFlags();
    const { hasLumoPlus } = useLumoPlan();
    const remainingLimits = useRemainingLimits();
    const imageLimitExhausted = isLimitExhausted(remainingLimits?.images);
    const imageUpsellConfig = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.COMPOSER_IMAGE_SELECTOR);
    const dispatch = useLumoDispatch();

    const handleWebSearchToggleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            handleWebSearchButtonClick();
        },
        [handleWebSearchButtonClick]
    );

    const handleCreateImageClick = useCallback(() => {
        if (imageLimitExhausted) {
            return;
        }

        onClickCreateImageOption();
    }, [imageLimitExhausted, onClickCreateImageOption]);

    const toolMenuItems = [
        {
            iconName: 'palette' as IconName,
            getLabel: () => c('collider_2025: Action').t`Create image`,
            getDescription: imageLimitExhausted
                ? () => c('collider_2025: Info').t`You've reached your image limit for this period.`
                : undefined,
            onClick: handleCreateImageClick,
            onClose: onClose,
            canShow: isImageToolsFlagEnabled,
            isDisabled: imageLimitExhausted,
        },
        {
            iconName: 'robot' as IconName,
            getLabel: () => c('collider_2025: Action').t`Custom ${LUMO_SHORT_APP_NAME}s`,
            getDescription: isGuest ? () => c('collider_2025:Placeholder').t`Sign in required` : undefined,
            onClick: () => dispatch(openAgentPicker()),
            onClose: onClose,
            canShow: isCustomAgentsFlagEnabled && (canUseAgents || isGuest),
            isDisabled: isGuest,
            isSignInRequired: isGuest,
        },
    ];
    const visibleToolMenuItems = toolMenuItems.filter((item) => item.canShow);
    const showImageUpsellFooter =
        imageLimitExhausted && !hasLumoPlus && Boolean(imageUpsellConfig?.onUpgrade || imageUpsellConfig?.path);

    return (
        <MenuDropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            className="tool-menu-dropdown"
            width="200px"
        >
            {visibleToolMenuItems.map((item) => (
                <div
                    key={item.iconName}
                    className={clsx(
                        item.isSignInRequired && 'tool-menu-item--sign-in-required',
                        item.isDisabled && !item.isSignInRequired && 'tool-menu-item--disabled pointer-events-none opacity-55'
                    )}
                >
                    <MenuItem {...item} />
                </div>
            ))}

            {visibleToolMenuItems.length > 1 && (
                <hr className="my-1 w-custom mx-auto" style={{ '--w-custom': '90%' }} />
            )}

            {showImageUpsellFooter && (
                <div className="tool-menu-upsell flex flex-column gap-3 p-3 border-top border-weak">
                    <p className="m-0 text-sm color-norm">
                        {c('collider_2025: Info')
                            .t`Upgrade for more image generations and access to advanced models.`}
                    </p>
                    <BasicUpgradeButton
                        className="shrink-0"
                        path={imageUpsellConfig?.path}
                        onClick={
                            imageUpsellConfig?.onUpgrade
                                ? () => {
                                      sendUpgradeButtonClickedEvent({
                                          feature: LUMO_UPSELL_PATHS.COMPOSER_IMAGE_SELECTOR,
                                          to: 'modal',
                                      });
                                      imageUpsellConfig.onUpgrade?.();
                                      onClose();
                                  }
                                : imageUpsellConfig?.path
                                  ? () => {
                                        sendUpgradeButtonClickedEvent({
                                            feature: LUMO_UPSELL_PATHS.COMPOSER_IMAGE_SELECTOR,
                                            to: 'path',
                                        });
                                        onClose();
                                    }
                                  : undefined
                        }
                    />
                </div>
            )}

            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className="flex flex-row flex-nowrap items-center justify-space-between px-4 py-2 w-full gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <IcGlobe size={4} className="" />
                    <div className="flex flex-column">
                        <span className="text-sm font-medium">{c('collider_2025: Action').t`Web search`}</span>
                    </div>
                </div>
                <Toggle checked={isWebSearchButtonToggled} onChange={handleWebSearchToggleChange} />
            </div>
        </MenuDropdown>
    );
};
