import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

interface UploadMenuDropdownProps {
    isOpen: boolean;
    anchorRef: React.RefObject<HTMLElement>;
    onClose: () => void;
    onUploadFromComputer: () => void;
    onBrowseDrive: () => void;
}

export const UploadMenuDropdown = ({
    isOpen,
    anchorRef,
    onClose,
    onUploadFromComputer,
    onBrowseDrive,
}: UploadMenuDropdownProps) => {
    return (
        <Dropdown
            isOpen={isOpen}
            anchorRef={anchorRef}
            onClose={onClose}
            originalPlacement="top-start"
            size={{
                width: '200px',
            }}
        >
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
            <DropdownMenuButton
                onClick={() => {
                    onUploadFromComputer();
                    onClose();
                }}
                className="justify-start"
            >
                <div className="flex items-center gap-3">
                    <IcArrowUpLine size={5} className="color-weak" />
                    <div className="flex flex-column">
                        <span className="text-sm font-medium">{c('collider_2025: Action').t`Upload from device`}</span>
                    </div>
                </div>
            </DropdownMenuButton>
        </Dropdown>
    );
};
