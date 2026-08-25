import { c } from 'ttag';

import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { LumoIcon } from '../LumoIcon/LumoIcon';
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
    isAgent?: boolean;
}

export const UploadMenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    onUploadFromComputer,
    onBrowseDrive,
    onDrawSketch,
    fileUploadMode,
    isAgent = false,
}: UploadMenuDropdownProps) => {
    const { imageTools: ffImageToolsEnabled } = useLumoFlags();

    // Show "Add from Drive" browse option only for authenticated users without a linked folder and guest users (will trigger upsell)
    // The agent surface keeps the composer minimal, so Drive browsing is hidden there.
    const showBrowseDriveOption = fileUploadMode !== 'linked-drive' && !isAgent;
    // If drive folder linked, uploads should go to drive, otherwise they will be handled locally
    const showUploadToDrive = fileUploadMode === 'linked-drive';

    const uploadMenuItems: UploadActionItemProps[] = [
        {
            icon: <IcBrandProtonDrive size={4} />,
            getLabel: () => c('collider_2025: UploadAction').t`Add from ${DRIVE_APP_NAME}`,
            onClick: onBrowseDrive,
            onClose: onClose,
            canShow: showBrowseDriveOption,
        },
        {
            icon: showUploadToDrive ? <IcBrandProtonDriveFilled size={4} /> : <LumoIcon name="Upload" size={16} />,
            getLabel: () =>
                showUploadToDrive
                    ? c('collider_2025: Action').t`Add file to ${DRIVE_APP_NAME}`
                    : c('collider_2025: Action').t`Upload from device`,
            onClick: onUploadFromComputer,
            onClose: onClose,
            canShow: true,
        },
        {
            icon: <LumoIcon name="Pencil" size={16} />,
            getLabel: () => c('collider_2025: Action').t`Draw a sketch`,
            onClick: onDrawSketch,
            onClose: onClose,
            canShow: ffImageToolsEnabled && !isAgent,
        },
    ].filter((item) => item.canShow);

    return (
        <MenuDropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            autoClose={false}
            className="upload-menu-dropdown rounded-xl"
        >
            {uploadMenuItems.map((item, index) => (
                <MenuItem key={index} {...item} />
            ))}
        </MenuDropdown>
    );
};
