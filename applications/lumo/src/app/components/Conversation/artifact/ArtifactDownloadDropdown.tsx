import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { Dropdown, DropdownMenu, DropdownMenuButton } from '@proton/components';

import { LumoIcon } from '../../LumoIcon/LumoIcon';
import { getArtifactDownloadLabel, getArtifactSourceDownloadLabel } from './artifactSaveFormats';
import type { ArtifactType } from './parseArtifacts';

interface ArtifactDownloadDropdownProps {
    artifactType: ArtifactType;
    onDownloadSource: () => void;
    onDownloadTxt?: () => void;
    onDownloadPdf?: () => void;
    onDownloadPptx?: () => void;
}

export const ArtifactDownloadDropdown = ({
    artifactType,
    onDownloadSource,
    onDownloadTxt,
    onDownloadPdf,
    onDownloadPptx,
}: ArtifactDownloadDropdownProps) => {
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
                title={c('collider_2025:Action').t`Download`}
                aria-label={c('collider_2025:Action').t`Download`}
                aria-expanded={isOpen}
                onClick={toggle}
            >
                <LumoIcon name="Download" size={16} />
            </Button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center"
                        onClick={() => {
                            onDownloadSource();
                            close();
                        }}
                    >
                        <LumoIcon name="Download" size={16} className="mr-2 shrink-0 color-weak" />
                        {getArtifactSourceDownloadLabel(artifactType)}
                    </DropdownMenuButton>
                    {onDownloadTxt && (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={() => {
                                onDownloadTxt();
                                close();
                            }}
                        >
                            <LumoIcon name="FileText" size={16} className="mr-2 shrink-0 color-weak" />
                            {getArtifactDownloadLabel('txt')}
                        </DropdownMenuButton>
                    )}
                    {onDownloadPdf && (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={() => {
                                void onDownloadPdf();
                                close();
                            }}
                        >
                            <LumoIcon name="FileText" size={16} className="mr-2 shrink-0 color-weak" />
                            {getArtifactDownloadLabel('pdf')}
                        </DropdownMenuButton>
                    )}
                    {onDownloadPptx && (
                        <DropdownMenuButton
                            className="text-left flex flex-nowrap items-center"
                            onClick={() => {
                                void onDownloadPptx();
                                close();
                            }}
                        >
                            <LumoIcon name="Presentation" size={16} className="mr-2 shrink-0 color-weak" />
                            {getArtifactDownloadLabel('pptx')}
                        </DropdownMenuButton>
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
