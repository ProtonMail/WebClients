import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Dropdown, DropdownMenu, DropdownMenuButton } from '@proton/components';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';

import { LumoIcon } from '../../LumoIcon/LumoIcon';
import type { ArtifactSaveFormat } from './artifactSaveFormats';
import { getArtifactSaveFormatLabel } from './artifactSaveFormats';

interface ArtifactSaveToDriveDropdownProps {
    formats: ArtifactSaveFormat[];
    onSaveToDrive: (format: ArtifactSaveFormat) => void;
}

const getSaveFormatIcon = (format: ArtifactSaveFormat): 'Download' | 'FileText' | 'Presentation' => {
    if (format === 'pdf') {
        return 'FileText';
    }

    if (format === 'pptx') {
        return 'Presentation';
    }

    return 'Download';
};

export const ArtifactSaveToDriveDropdown = ({ formats, onSaveToDrive }: ArtifactSaveToDriveDropdownProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Button
                ref={anchorRef}
                icon
                shape="ghost"
                color="weak"
                size="small"
                className="artifact-btn shrink-0"
                title={c('collider_2025:Action').t`Save to Drive`}
                aria-label={c('collider_2025:Action').t`Save to Drive`}
                aria-expanded={isOpen}
                onClick={toggle}
            >
                <IcBrandProtonDriveFilled size={4} />
            </Button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
                <DropdownMenu>
                    {formats.map((format) => {
                        return (
                            <DropdownMenuButton
                                key={format}
                                className="text-left flex flex-nowrap items-center"
                                onClick={() => {
                                    onSaveToDrive(format);
                                    close();
                                }}
                            >
                                <LumoIcon
                                    name={getSaveFormatIcon(format)}
                                    size={16}
                                    className="mr-2 shrink-0 color-weak"
                                />
                                {getArtifactSaveFormatLabel(format)}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
