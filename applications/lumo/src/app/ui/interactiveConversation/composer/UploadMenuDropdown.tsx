import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { IcPen } from '@proton/icons/icons/IcPen';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../../hooks/useLumoFlags';

import './UploadMenuDropdown.scss';

interface UploadMenuDropdownProps {
    isOpen: boolean;
    anchorRef: React.RefObject<HTMLElement>;
    onClose: () => void;
    onUploadFromComputer: () => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    /** Hide the "Add from Proton Drive" option (e.g., when a Drive folder is already linked) */
    hideDriveOption?: boolean;
    /** When true, shows "Add file to Drive" instead of "Upload from device" */
    uploadsToDrive?: boolean;
}

export const UploadMenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    onUploadFromComputer,
    onBrowseDrive,
    onDrawSketch,
    hideDriveOption = false,
    uploadsToDrive = false,
}: UploadMenuDropdownProps) => {
    const { imageTools: ffImageTools } = useLumoFlags();
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
            {!hideDriveOption && (
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
                    {uploadsToDrive ? (
                        <IcBrandProtonDriveFilled size={5} className="color-weak" />
                    ) : (
                        <IcArrowUpLine size={5} className="color-weak" />
                    )}
                    <div className="flex flex-column">
                        <span className="text-sm font-medium">
                            {uploadsToDrive
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
