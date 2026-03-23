import { c } from 'ttag';

import type { IconName } from '@proton/icons/types';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import type { MenuDropdownProps, MenuItemProps } from './components/MenuDropdown';
import { MenuDropdown, MenuItem } from './components/MenuDropdown';
import type { FileUploadMode } from './hooks/useFileHandling';

import './UploadMenuDropdown.scss';

interface UploadActionItemProps extends MenuItemProps {
    canShow: boolean;
}

interface UploadMenuDropdownProps extends Pick<MenuDropdownProps, 'isOpen' | 'anchorRef' | 'onClose'> {
    onUploadFromComputer: () => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    fileUploadMode: FileUploadMode;
}

export const UploadMenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    onUploadFromComputer,
    onBrowseDrive,
    onDrawSketch,
    fileUploadMode,
}: UploadMenuDropdownProps) => {
    const { imageTools: ffImageToolsEnabled } = useLumoFlags();

    // Show "Add from Drive" browse option only for authenticated users without a linked folder and guest users (will trigger upsell)
    const showBrowseDriveOption = fileUploadMode !== 'linked-drive';
    // If drive fodler linked, uploads should go to drive, otherwise they will be handled locally
    const showUploadToDrive = fileUploadMode === 'linked-drive';

    const uploadMenuItems: UploadActionItemProps[] = [
        {
            iconName: 'brand-proton-drive' as IconName,
            getLabel: () => c('collider_2025: UploadAction').t`Add from ${DRIVE_APP_NAME}`,
            onClick: onBrowseDrive,
            onClose: onClose,
            canShow: showBrowseDriveOption,
        },
        {
            iconName: showUploadToDrive ? ('brand-proton-drive-filled' as IconName) : ('file-arrow-in-up' as IconName),
            getLabel: () =>
                showUploadToDrive
                    ? c('collider_2025: Action').t`Add file to ${DRIVE_APP_NAME}`
                    : c('collider_2025: Action').t`Upload from device`,
            onClick: onUploadFromComputer,
            onClose: onClose,
            canShow: true,
        },
        {
            iconName: 'pencil' as IconName,
            getLabel: () => c('collider_2025: Action').t`Draw a sketch`,
            onClick: onDrawSketch,
            onClose: onClose,
            canShow: ffImageToolsEnabled,
        },
    ].filter((item) => item.canShow);

    return (
        <MenuDropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            className="upload-menu-dropdown rounded-xl"
            width="200px"
        >
            {uploadMenuItems.map((item) => (
                <MenuItem key={item.iconName} {...item} />
            ))}
        </MenuDropdown>
    );
};
