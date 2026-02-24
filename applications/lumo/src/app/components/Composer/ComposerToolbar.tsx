import { useCallback, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcMicrophone } from '@proton/icons/icons/IcMicrophone';
import { IcPaperClip } from '@proton/icons/icons/IcPaperClip';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useWebSearch } from '../../providers/WebSearchProvider';
import LumoComposerToggleUpsell from '../../upsells/composed/LumoComposerToggleUpsell';
import { getAcceptAttributeString } from '../../util/filetypes';
import { sendFileUploadEvent, sendVoiceEntryClickEvent } from '../../util/telemetry';
import PressEnterToReturn from './PressEnterToReturn';
import { UploadMenuDropdown } from './UploadMenuDropdown';
import type { FileUploadMode } from './hooks/useFileHandling';

export interface ComposerToolbarProps {
    onFilesSelected: (files: File[]) => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    hasAttachments: boolean;
    canShowLumoUpsellToggle?: boolean;
    fileUploadMode: FileUploadMode;
}

export const ComposerToolbar = ({
    onFilesSelected,
    onBrowseDrive,
    onDrawSketch,
    hasAttachments,
    canShowLumoUpsellToggle,
    fileUploadMode,
}: ComposerToolbarProps) => {
    const { isWebSearchButtonToggled, handleWebSearchButtonClick } = useWebSearch();
    const uploadButtonRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
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

    return (
        <div className="flex flex-row flex-nowrap items-center justify-space-between w-full mt-1">
            <div className="flex flex-row flex-nowrap items-center gap-2 pl-1">
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
                        'border-0 shrink-0 flex flex-row flex-nowrap gap-1 items-center color-weak',
                        showUploadMenu && 'is-active'
                    )}
                    onClick={handleUploadButtonClick}
                    shape="ghost"
                    size="small"
                >
                    <IcPaperClip size={6} />
                    <span className="hidden sm:block text-sm mt-0.5">{c('collider_2025: Button').t`Upload`}</span>
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
                    <Button
                        icon
                        className={clsx(
                            'web-search-button order-0 shrink-0 inline-flex flex-row flex-nowrap gap-1 items-center color-weak',
                            isWebSearchButtonToggled && 'is-active'
                        )}
                        disabled={hasAttachments}
                        onClick={handleWebSearchButtonClick}
                        shape="ghost"
                        size="small"
                    >
                        <IcGlobe size={6} />
                        <span className="hidden sm:block text-sm mt-0.5">
                            {c('collider_2025: Button').t`Web search`}
                        </span>
                    </Button>
                )}
            </div>
            <div className="flex flex-row flex-nowrap items-center gap-2 mr-2">
                {canShowLumoUpsellToggle ? (
                    <div className="flex flex-row">
                        <LumoComposerToggleUpsell />
                    </div>
                ) : (
                    <PressEnterToReturn />
                )}
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
