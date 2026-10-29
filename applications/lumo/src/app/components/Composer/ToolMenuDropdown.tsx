import { useCallback, useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Toggle from '@proton/components/components/toggle/Toggle';
import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useArtifactCreation } from '../../providers/ArtifactCreationProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { isLimitExhausted, useRemainingLimits } from '../../services/usageLimitsStore';
import BasicUpgradeButton from '../../upsells/primitives/BasicUpgradeButton';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';
import { sendUpgradeButtonClickedEvent } from '../../util/telemetry';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import { NewLabel } from '../NewLabel';
import { ConnectorList } from './ConnectorList';
import { SkillMenuList } from './SkillMenuList';
import { MenuDropdown, type MenuDropdownProps, MenuItem } from './components/MenuDropdown';

import './ToolMenuDropdown.scss';

interface ToolMenuDropdownProps extends Pick<MenuDropdownProps, 'isOpen' | 'anchorRef' | 'onClose'> {
    onClickCreateImageOption: () => void;
    canUseAgents?: boolean;
    showArtifactNewLabel?: boolean;
    onArtifactCreationToggle?: () => void;
}

export const ToolMenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    onClickCreateImageOption,
    canUseAgents = false,
    showArtifactNewLabel = false,
    onArtifactCreationToggle,
}: ToolMenuDropdownProps) => {
    const { isWebSearchButtonToggled, handleWebSearchButtonClick } = useWebSearch();
    const { isArtifactCreationEnabled, handleArtifactCreationToggle } = useArtifactCreation();
    const isGuest = useIsGuest();
    const {
        imageTools: isImageToolsFlagEnabled,
        externalTools: isToolsFlagEnabled,
        customAgents: isCustomAgentsFlagEnabled,
        artifactsView: isArtifactsViewFlagEnabled,
    } = useLumoFlags();
    const { hasLumoPlus } = useLumoPlan();
    const remainingLimits = useRemainingLimits();
    const imageLimitExhausted = isLimitExhausted(remainingLimits?.images);
    const imageUpsellConfig = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.COMPOSER_IMAGE_SELECTOR);
    const [view, setView] = useState<'main' | 'connectors' | 'skills'>('main');
    const showConnectors = isToolsFlagEnabled && isDesktopEnvironment();

    useEffect(() => {
        if (!isOpen) {
            setView('main');
        }
    }, [isOpen]);

    const handleWebSearchToggleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            handleWebSearchButtonClick();
        },
        [handleWebSearchButtonClick]
    );

    const handleArtifactCreationToggleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            onArtifactCreationToggle?.();
            handleArtifactCreationToggle();
        },
        [handleArtifactCreationToggle, onArtifactCreationToggle]
    );

    const handleCreateImageClick = useCallback(() => {
        if (imageLimitExhausted) {
            return;
        }

        onClickCreateImageOption();
    }, [imageLimitExhausted, onClickCreateImageOption]);

    let imageUpsellOnClick: (() => void) | undefined;
    if (imageUpsellConfig?.onUpgrade) {
        imageUpsellOnClick = () => {
            sendUpgradeButtonClickedEvent({
                feature: LUMO_UPSELL_PATHS.COMPOSER_IMAGE_SELECTOR,
                to: 'modal',
            });
            imageUpsellConfig.onUpgrade?.();
            onClose();
        };
    } else if (imageUpsellConfig?.path) {
        imageUpsellOnClick = () => {
            sendUpgradeButtonClickedEvent({
                feature: LUMO_UPSELL_PATHS.COMPOSER_IMAGE_SELECTOR,
                to: 'path',
            });
            onClose();
        };
    }

    const toolMenuItems = [
        {
            icon: <LumoIcon name="Palette" size={16} />,
            getLabel: () => c('collider_2025: Action').t`Create image`,
            getDescription: imageLimitExhausted
                ? () => c('collider_2025: Info').t`You've reached your image limit for this period.`
                : undefined,
            onClick: handleCreateImageClick,
            onClose: onClose,
            canShow: isToolsFlagEnabled && isImageToolsFlagEnabled,
            isDisabled: imageLimitExhausted,
        },
    ];
    const showSkills = isToolsFlagEnabled && isCustomAgentsFlagEnabled && (canUseAgents || isGuest);
    const visibleToolMenuItems = toolMenuItems.filter((item) => item.canShow);
    const showImageUpsellFooter =
        imageLimitExhausted && !hasLumoPlus && Boolean(imageUpsellConfig?.onUpgrade || imageUpsellConfig?.path);
    const showToolToggles = isToolsFlagEnabled || isArtifactsViewFlagEnabled;

    return (
        <MenuDropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            className="tool-menu-dropdown"
            width="200px"
            autoClose={false}
        >
            {view === 'connectors' && <ConnectorList onBack={() => setView('main')} />}
            {view === 'skills' && <SkillMenuList onBack={() => setView('main')} onClose={onClose} />}
            {view === 'main' && (
                <>
                    {visibleToolMenuItems.map((item, index) => (
                        <div
                            key={index}
                            className={clsx(
                                item.isDisabled && 'tool-menu-item--disabled pointer-events-none opacity-55'
                            )}
                        >
                            <MenuItem {...item} />
                        </div>
                    ))}

                    {showSkills && (
                        <div className={clsx(isGuest && 'tool-menu-item--sign-in-required')}>
                            <DropdownMenuButton
                                className="justify-start"
                                disabled={isGuest}
                                onClick={() => setView('skills')}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <span className="shrink-0 flex">
                                        <LumoIcon name="Sparkles" size={16} />
                                    </span>
                                    <div className="flex flex-column flex-1 min-w-0 text-left">
                                        <span className="text-sm font-medium">{c('collider_2025: Action')
                                            .t`Skills`}</span>
                                        {isGuest && (
                                            <span className="text-xs color-hint">{c('collider_2025:Placeholder')
                                                .t`Sign in required`}</span>
                                        )}
                                    </div>
                                    {!isGuest && <LumoIcon name="ChevronRight" size={16} />}
                                </div>
                            </DropdownMenuButton>
                        </div>
                    )}

                    {(visibleToolMenuItems.length > 0 || showSkills) && showToolToggles && (
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
                                onClick={imageUpsellOnClick}
                            />
                        </div>
                    )}

                    {isArtifactsViewFlagEnabled && (
                        /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
                        <div
                            className={clsx(
                                'flex flex-row flex-nowrap items-center justify-space-between px-4 py-2 w-full gap-4',
                                isGuest && 'tool-menu-item--sign-in-required'
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3">
                                <LumoIcon name="FileText" size={16} />
                                <div className="flex flex-column">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        {c('collider_2025: Action').t`Creations`}
                                        {showArtifactNewLabel ? <NewLabel /> : null}
                                    </span>
                                    <span className="text-xs color-weak">
                                        {isGuest
                                            ? c('collider_2025:Placeholder').t`Sign in required`
                                            : c('collider_2025: Info').t`For this chat`}
                                    </span>
                                </div>
                            </div>
                            <Toggle
                                id="artifact-creation-toggle"
                                checked={isGuest ? false : isArtifactCreationEnabled}
                                disabled={isGuest}
                                onChange={handleArtifactCreationToggleChange}
                            />
                        </div>
                    )}

                    {isToolsFlagEnabled && (
                        /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
                        <div
                            className="flex flex-row flex-nowrap items-center justify-space-between px-4 py-2 w-full gap-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3">
                                <LumoIcon name="Globe" size={16} />
                                <div className="flex flex-column">
                                    <span className="text-sm font-medium">{c('collider_2025: Action')
                                        .t`Web search`}</span>
                                </div>
                            </div>
                            <Toggle
                                id="web-search-toggle"
                                checked={isWebSearchButtonToggled}
                                onChange={handleWebSearchToggleChange}
                            />
                        </div>
                    )}

                    {showConnectors && (
                        <DropdownMenuButton className="justify-start" onClick={() => setView('connectors')}>
                            <div className="flex items-center gap-3 w-full">
                                <span className="shrink-0 flex">
                                    <LumoIcon name="Blocks" size={16} />
                                </span>
                                <span className="text-sm font-medium flex-1 text-left">{c('collider_2025: Action')
                                    .t`Connectors`}</span>
                                <LumoIcon name="ChevronRight" size={16} />
                            </div>
                        </DropdownMenuButton>
                    )}
                </>
            )}
        </MenuDropdown>
    );
};
