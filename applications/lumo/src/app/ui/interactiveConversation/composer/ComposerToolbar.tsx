import { useRef } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { IcGlobe, IcMicrophone, IcPaperClip } from '@proton/icons';
import useFlag from '@proton/unleash/useFlag';

import { getAcceptAttributeString } from '../../../util/filetypes';
import LumoPlusToggle from './LumoPlusToggle';
import { UploadMenu } from './UploadMenu';

export interface ComposerToolbarProps {
    // File handling props
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleOpenFileDialog: () => void;
    handleBrowseDrive: () => void;

    // Upload menu state
    showUploadMenu: boolean;
    setShowUploadMenu: (show: boolean) => void;
    handleUploadButtonClick: () => void;

    // Web search props
    isWebSearchButtonToggled: boolean;
    handleWebSearchButtonClick: () => void;
    hasAttachments: boolean;

    // UI state props
    canShowLumoUpsellToggle: boolean;
}

export const ComposerToolbar = ({
    fileInputRef,
    handleFileInputChange,
    handleOpenFileDialog,
    handleBrowseDrive,
    showUploadMenu,
    setShowUploadMenu,
    handleUploadButtonClick,
    isWebSearchButtonToggled,
    handleWebSearchButtonClick,
    hasAttachments,
    canShowLumoUpsellToggle,
}: ComposerToolbarProps) => {
    const uploadButtonRef = useRef<HTMLButtonElement>(null);
    const isLumoToolingEnabled = useFlag('LumoTooling');

    const shiftEnterBoldText = (
        <kbd
            key={c('collider_2025: Characteristic Title').t`Enter`} // only there to prevent a react warning
        >{c('collider_2025: Characteristic Title').t`Enter`}</kbd>
    );

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
                <div className="relative">
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
                    <UploadMenu
                        isOpen={showUploadMenu}
                        onClose={() => setShowUploadMenu(false)}
                        onUploadFromComputer={handleOpenFileDialog}
                        onBrowseDrive={handleBrowseDrive}
                        buttonRef={uploadButtonRef}
                    />
                </div>
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
                        <LumoPlusToggle />
                    </div>
                ) : (
                    <div className="hidden md:flex flex-row flex-nowrap gap-2 color-hint prompt-entry-hint">
                        <Icon name="arrow-left-and-down" />
                        <span className="text-xs">
                            {c('collider_2025: Info').jt`Press ${shiftEnterBoldText} to ask`}
                        </span>
                    </div>
                )}

                <div className={clsx('flex flex-row flex-nowrap gap-2 color-hint hidden')} id="voice-entry-mobile">
                    <Button
                        icon
                        id="voice-entry-mobile-button"
                        className="border-0 shrink-0 inline-flex flex-row flex-nowrap gap-1 items-center color-weak"
                        shape="ghost"
                        size="small"
                    >
                        <IcMicrophone size={6} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
