import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { IcPen } from '@proton/icons/icons/IcPen';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import type { FileUploadMode } from './hooks/useFileHandling';

import './UploadMenuDropdown.scss';

interface UploadMenuDropdownProps {
    isOpen: boolean;
    anchorRef: React.RefObject<HTMLElement>;
    onClose: () => void;
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
    const { imageTools: ffImageTools } = useLumoFlags();

    // Show "Add from Drive" browse option only for authenticated users without a linked folder and guest users (will trigger upsell)
    const showBrowseDriveOption = fileUploadMode !== 'linked-drive';
    // If drive fodler linked, uploads should go to drive, otherwise they will be handled locally
    const showUploadToDrive = fileUploadMode === 'linked-drive';

    return (
        <Dropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            originalPlacement="top-start"
            size={{
                width: '200px',
            }}
            className="upload-menu-dropdown"
        >
            {showBrowseDriveOption && (
                <DropdownMenuButton
                    onClick={() => {
                        onBrowseDrive();
                        onClose();
                    }}
                    className="justify-start"
                >
                    <div className="flex items-center gap-3">
                        <IcBrandProtonDriveFilled size={5} className="color-weak" />
                        <div className="flex flex-column">
                            <span className="text-sm font-medium">
                                {c('collider_2025: Action').t`Add from ${DRIVE_APP_NAME}`}
                            </span>
                        </div>
                    </div>
                </DropdownMenuButton>
            )}
            <DropdownMenuButton
                onClick={() => {
                    onUploadFromComputer();
                    onClose();
                }}
                className="justify-start"
            >
                <div className="flex items-center gap-3">
                    {showUploadToDrive ? (
                        <IcBrandProtonDriveFilled size={5} className="color-weak" />
                    ) : (
                        <IcArrowUpLine size={5} className="color-weak" />
                    )}
                    <div className="flex flex-column">
                        <span className="text-sm font-medium">
                            {showUploadToDrive
                                ? c('collider_2025: Action').t`Add file to ${DRIVE_APP_NAME}`
                                : c('collider_2025: Action').t`Upload from device`}
                        </span>
                    </div>
                </div>
            </DropdownMenuButton>
            {ffImageTools && (
                <DropdownMenuButton
                    onClick={() => {
                        onDrawSketch();
                        onClose();
                    }}
                    className="justify-start"
                >
                    <div className="flex items-center gap-3">
                        <IcPen size={5} className="color-weak" />
                        <div className="flex flex-column">
                            <span className="text-sm font-medium">{c('collider_2025: Action').t`Draw a sketch`}</span>
                        </div>
                    </div>
                </DropdownMenuButton>
            )}
        </Dropdown>
    );
};
