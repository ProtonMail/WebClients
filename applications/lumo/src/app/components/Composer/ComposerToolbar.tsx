import { useCallback, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMicrophone } from '@proton/icons/icons/IcMicrophone';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSliders } from '@proton/icons/icons/IcSliders';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { getAcceptAttributeString } from '../../util/filetypes';
import { sendFileUploadEvent, sendVoiceEntryClickEvent } from '../../util/telemetry';
import { ToolMenuDropdown } from './ToolMenuDropdown';
import { UploadMenuDropdown } from './UploadMenuDropdown';
import type { FileUploadMode } from './hooks/useFileHandling';

export interface ComposerToolbarProps {
    onFilesSelected: (files: File[]) => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    fileUploadMode: FileUploadMode;

    // From legacy composer component - can delete
    // hasAttachments: boolean;
    // canShowLumoUpsellToggle?: boolean;
}

export const ComposerToolbar = ({
    onFilesSelected,
    onBrowseDrive,
    onDrawSketch,
    fileUploadMode,
}: ComposerToolbarProps) => {
    const uploadButtonRef = useRef<HTMLButtonElement>(null);
    const toolsButtonRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const { externalTools: isLumoToolingEnabled } = useLumoFlags();

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

    const handleToolsButtonClick = useCallback(() => {
        setShowToolsMenu((prev) => !prev);
    }, []);

    return (
        <div className="flex flex-row flex-nowrap items-center justify-space-between w-full mt-1">
            <div className="flex flex-row flex-nowrap items-center gap-1 pl-2">
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
                        'border-0 shrink-0 flex flex-row flex-nowrap gap-1 items-center color-weak rounded-full',
                        showUploadMenu && 'is-active'
                    )}
                    onClick={handleUploadButtonClick}
                    shape="ghost"
                    size="small"
                >
                    <IcPlus size={4} />
                </Button>
                <UploadMenuDropdown
                    isOpen={showUploadMenu}
                    anchorRef={uploadButtonRef}
                    onClose={() => setShowUploadMenu(false)}
                    onUploadFromComputer={handleOpenFileDialog}
                    onBrowseDrive={onBrowseDrive}
                    onDrawSketch={onDrawSketch}
                    fileUploadMode={fileUploadMode}
                />
                {isLumoToolingEnabled && (
                    <>
                        <Button
                            ref={toolsButtonRef}
                            className={clsx(
                                'border-0 shrink-0 flex flex-row flex-nowrap gap-2 items-center color-weak py-1.5 rounded-full',
                                showToolsMenu && 'is-active'
                            )}
                            onClick={handleToolsButtonClick}
                            shape="ghost"
                            size="small"
                        >
                            <IcSliders size={4} />
                            <span className="hidden sm:block text-sm">{c('collider_2025: Button').t`Tools`}</span>
                        </Button>
                        <ToolMenuDropdown
                            isOpen={showToolsMenu}
                            anchorRef={toolsButtonRef}
                            onClose={() => setShowToolsMenu(false)}
                            // TODO: add create image logic here
                        />
                    </>
                )}
            </div>
            <div className="flex flex-row flex-nowrap items-center gap-2 mr-2">
                <div className={clsx('flex flex-row flex-nowrap gap-2 color-hint hidden')} id="voice-entry-mobile">
                    <Button
                        icon
                        id="voice-entry-mobile-button"
                        className="border-0 shrink-0 inline-flex flex-row flex-nowrap gap-1 items-center color-weak"
                        shape="ghost"
                        size="small"
                        onClick={sendVoiceEntryClickEvent}
                    >
                        <IcMicrophone size={6} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
