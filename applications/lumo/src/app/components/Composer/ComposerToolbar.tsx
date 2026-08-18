import { useCallback, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import type { ImageAspectRatio } from '../../types';
import { ComposerMode } from '../../types';
import { getAcceptAttributeString } from '../../util/filetypes';
import { sendFileUploadEvent, sendVoiceEntryClickEvent } from '../../util/telemetry';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import AspectRatioDropdown from './AspectRatioDropdown';
import { ModelModeDropdown } from './ModelModeDropdown';
import { ToolMenuDropdown } from './ToolMenuDropdown';
import { UploadMenuDropdown } from './UploadMenuDropdown';
import type { FileUploadMode } from './hooks/useFileHandling';

interface UploadMenuSectionProps {
    onFilesSelected: (files: File[]) => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    fileUploadMode: FileUploadMode;
    isAgent?: boolean;
    buttonIcon?: React.ReactNode;
}

const UploadMenuSection = ({
    onFilesSelected,
    onBrowseDrive,
    onDrawSketch,
    fileUploadMode,
    isAgent = false,
    buttonIcon = <LumoIcon name="Plus" />,
}: UploadMenuSectionProps) => {
    const uploadButtonRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUploadMenu, setShowUploadMenu] = useState(false);

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files?.length) return;
            onFilesSelected(Array.from(e.target.files));
            e.target.value = '';
        },
        [onFilesSelected]
    );

    const handleOpenFileDialog = useCallback(() => {
        fileInputRef.current?.click();
        sendFileUploadEvent();
    }, []);

    const handleUploadButtonClick = useCallback(() => {
        setShowUploadMenu((prev) => !prev);
    }, []);

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                id="emptyFileCardInput"
                accept={getAcceptAttributeString()}
                className="hidden"
                multiple
                onChange={handleFileInputChange}
            />
            <Button
                ref={uploadButtonRef}
                icon
                className={clsx(
                    'border-0 shrink-0 flex flex-row flex-nowrap gap-1 items-center rounded-full',
                    showUploadMenu && 'is-active'
                )}
                onClick={handleUploadButtonClick}
                shape="ghost"
                size="small"
            >
                {buttonIcon}
            </Button>
            <UploadMenuDropdown
                isOpen={showUploadMenu}
                anchorRef={uploadButtonRef}
                onClose={() => setShowUploadMenu(false)}
                onUploadFromComputer={handleOpenFileDialog}
                onBrowseDrive={onBrowseDrive}
                onDrawSketch={onDrawSketch}
                fileUploadMode={fileUploadMode}
                isAgent={isAgent}
            />
        </>
    );
};

export interface ComposerToolbarProps {
    composerMode: ComposerMode;
    onFilesSelected: (files: File[]) => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    fileUploadMode: FileUploadMode;
    selectedAspectRatio: ImageAspectRatio;
    onAspectRatioChange: (ratio: ImageAspectRatio) => void;
    isCreateImageMode: boolean;
    onCreateImageModeChange: (enabled: boolean) => void;
    isArtifactMode: boolean;
    onArtifactModeChange: (enabled: boolean) => void;
    canUseAgents?: boolean;
    isAgent?: boolean;
}

export const ComposerToolbar = ({
    composerMode,
    onFilesSelected,
    onBrowseDrive,
    onDrawSketch,
    fileUploadMode,
    selectedAspectRatio,
    onAspectRatioChange,
    isCreateImageMode,
    onCreateImageModeChange,
    isArtifactMode,
    onArtifactModeChange,
    canUseAgents = false,
    isAgent = false,
}: ComposerToolbarProps) => {
    const toolsButtonRef = useRef<HTMLButtonElement>(null);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const { imageTools: isImageToolsFlagEnabled } = useLumoFlags();

    const handleToolsButtonClick = useCallback(() => {
        setShowToolsMenu((prev) => !prev);
    }, []);

    const uploadSectionProps = { onFilesSelected, onBrowseDrive, onDrawSketch, fileUploadMode, isAgent };

    if (composerMode === ComposerMode.GALLERY) {
        return (
            <div className="flex flex-row flex-nowrap items-center justify-space-between w-full mt-1">
                <div className="flex flex-row flex-nowrap items-center gap-1 pl-2">
                    <UploadMenuSection {...uploadSectionProps} buttonIcon={<LumoIcon name="ImagePlus" size={16} />} />
                </div>
                <div className="flex flex-row flex-nowrap items-center mr-2">
                    <AspectRatioDropdown selectedRatio={selectedAspectRatio} onSelect={onAspectRatioChange} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-row flex-nowrap items-center justify-space-between w-full mt-1">
            <div className="flex flex-row flex-nowrap items-center gap-1 pl-2">
                <UploadMenuSection {...uploadSectionProps} />
                {!isCreateImageMode && !isArtifactMode && !isAgent && (
                    <>
                        <Button
                            ref={toolsButtonRef}
                            className={clsx(
                                'border-0 shrink-0 flex flex-row flex-nowrap gap-2 items-center py-1.5 rounded-full',
                                showToolsMenu && 'is-active'
                            )}
                            onClick={handleToolsButtonClick}
                            shape="ghost"
                            size="small"
                        >
                            {/* <IcSliders size={4} /> */}
                            <LumoIcon name="SlidersHorizontal" />
                            <span className="hidden sm:block text-sm">{c('collider_2025: Button').t`Tools`}</span>
                        </Button>
                        <ToolMenuDropdown
                            isOpen={showToolsMenu}
                            anchorRef={toolsButtonRef}
                            onClose={() => setShowToolsMenu(false)}
                            onClickCreateImageOption={() => onCreateImageModeChange(true)}
                            onClickCreateArtifactOption={() => onArtifactModeChange(true)}
                            canUseAgents={canUseAgents}
                        />
                    </>
                )}
                {isCreateImageMode && (
                    <Button
                        onClick={() => onCreateImageModeChange(false)}
                        className="border-none shrink-0 flex flex-row flex-nowrap gap-2 items-center color-primary py-1.5 rounded-full group-hover-opacity-container hover:color-primary"
                        shape="ghost"
                        size="small"
                        title={c('collider_2025: Button').t`Create image`}
                        aria-label={c('collider_2025: Button').t`Create image`}
                    >
                        <LumoIcon name="Palette" size={16} />
                        <span className="text-sm hidden sm:block">{c('collider_2025: Button').t`Create image`}</span>
                        <LumoIcon name="X" width={12} height={12} className="group-hover:opacity-100" />
                    </Button>
                )}
                {isArtifactMode && (
                    <Button
                        onClick={() => onArtifactModeChange(false)}
                        className="border-none shrink-0 flex flex-row flex-nowrap gap-2 items-center color-primary py-1.5 rounded-full group-hover-opacity-container hover:color-primary"
                        shape="ghost"
                        size="small"
                        title={c('collider_2025: Button').t`Create artifact`}
                        aria-label={c('collider_2025: Button').t`Create artifact`}
                    >
                        <LumoIcon name="FileText" size={16} />
                        <span className="text-sm hidden sm:block">{c('collider_2025: Button').t`Create artifact`}</span>
                        <LumoIcon name="X" width={12} height={12} className="group-hover:opacity-100" />
                    </Button>
                )}
            </div>
            <div className="flex flex-row flex-nowrap items-center gap-2 mr-2">
                <div className={clsx('flex flex-row flex-nowrap gap-2 color-hint hidden')} id="voice-entry-mobile">
                    <Button
                        icon
                        id="voice-entry-mobile-button"
                        className="border-0 shrink-0 inline-flex flex-row flex-nowrap gap-1 items-center"
                        shape="ghost"
                        size="small"
                        onClick={sendVoiceEntryClickEvent}
                    >
                        <LumoIcon name="Mic" size={16} />
                    </Button>
                </div>
                {isImageToolsFlagEnabled &&
                    !isAgent &&
                    (isCreateImageMode ? (
                        <AspectRatioDropdown selectedRatio={selectedAspectRatio} onSelect={onAspectRatioChange} />
                    ) : (
                        <ModelModeDropdown />
                    ))}
            </div>
        </div>
    );
};
