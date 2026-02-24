import { useCallback } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { IconName } from '@proton/icons/types';

import { useWebSearch } from '../../providers/WebSearchProvider';
import { MenuDropdown, type MenuDropdownProps, MenuItem } from './components/MenuDropdown';

import './UploadMenuDropdown.scss';

interface ToolMenuDropdownProps extends Pick<MenuDropdownProps, 'isOpen' | 'anchorRef' | 'onClose'> {
    // Additional props specific to ToolMenuDropdown can be added here such as handleCreateImageTool click
}

export const ToolMenuDropdown = ({ isOpen, anchorRef, onClose }: ToolMenuDropdownProps) => {
    const { isWebSearchButtonToggled, handleWebSearchButtonClick } = useWebSearch();

    const handleWebSearchToggleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            handleWebSearchButtonClick();
        },
        [handleWebSearchButtonClick]
    );

    // TODO: add create image logic here
    const toolMenuItems = [
        {
            iconName: 'palette' as IconName,
            getLabel: () => c('collider_2025: Action').t`Create image`,
            onClick: () => {
                console.log('create image clicked');
            },
            onClose: onClose,
            canShow: true,
        },
    ];

    return (
        <MenuDropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            className="upload-menu-dropdown"
            width="200px"
        >
            {toolMenuItems.map((item) => (
                <MenuItem key={item.iconName} {...item} />
            ))}

            <hr className="my-1" />

            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className="flex flex-nowrap items-center justify-space-between px-4 py-2 w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <Icon name="globe" size={5} className="color-weak" />
                    <div className="flex flex-column">
                        <span className="text-sm font-medium">{c('collider_2025: Action').t`Web search`}</span>
                    </div>
                </div>
                <Toggle checked={isWebSearchButtonToggled} onChange={handleWebSearchToggleChange} />
            </div>
        </MenuDropdown>
    );
};
