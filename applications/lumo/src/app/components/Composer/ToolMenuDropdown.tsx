import { useCallback } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { IconName } from '@proton/icons/types';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useWebSearch } from '../../providers/WebSearchProvider';
import { MenuDropdown, type MenuDropdownProps, MenuItem } from './components/MenuDropdown';

import './ToolMenuDropdown.scss';

interface ToolMenuDropdownProps extends Pick<MenuDropdownProps, 'isOpen' | 'anchorRef' | 'onClose'> {
    onClickCreateImageOption: () => void;
}

export const ToolMenuDropdown = ({ isOpen, anchorRef, onClose, onClickCreateImageOption }: ToolMenuDropdownProps) => {
    const { isWebSearchButtonToggled, handleWebSearchButtonClick } = useWebSearch();
    const { imageTools: isImageToolsFlagEnabled } = useLumoFlags();

    const handleWebSearchToggleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            handleWebSearchButtonClick();
        },
        [handleWebSearchButtonClick]
    );

    const toolMenuItems = [
        {
            iconName: 'palette' as IconName,
            getLabel: () => c('collider_2025: Action').t`Create image`,
            onClick: onClickCreateImageOption,
            onClose: onClose,
            canShow: isImageToolsFlagEnabled,
        },
    ];
    const visibleToolMenuItems = toolMenuItems.filter((item) => item.canShow);

    return (
        <MenuDropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            className="tool-menu-dropdown rounded-xl"
            width="200px"
        >
            {visibleToolMenuItems.map((item) => (
                <MenuItem key={item.iconName} {...item} />
            ))}

            {visibleToolMenuItems.length > 1 && (
                <hr className="my-1 w-custom mx-auto" style={{ '--w-custom': '90%' }} />
            )}

            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className="flex flex-nowrap items-center justify-space-between px-4 py-2 w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <Icon name="globe" size={4} className="" />
                    <div className="flex flex-column">
                        <span className="text-sm font-medium">{c('collider_2025: Action').t`Web search`}</span>
                    </div>
                </div>
                <Toggle checked={isWebSearchButtonToggled} onChange={handleWebSearchToggleChange} />
            </div>
        </MenuDropdown>
    );
};
