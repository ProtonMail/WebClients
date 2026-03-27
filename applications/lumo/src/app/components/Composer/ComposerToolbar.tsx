import { useCallback, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcMicrophone } from '@proton/icons/icons/IcMicrophone';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSliders } from '@proton/icons/icons/IcSliders';
import { isIos } from '@proton/shared/lib/helpers/browser';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { ComposerMode } from '../../types';
import { getAcceptAttributeString, getAcceptAttributeStringWithoutImages } from '../../util/filetypes';
import { sendFileUploadEvent, sendVoiceEntryClickEvent } from '../../util/telemetry';
import { ModelModeDropdown } from './ModelModeDropdown';
import { ToolMenuDropdown } from './ToolMenuDropdown';
import { UploadMenuDropdown } from './UploadMenuDropdown';
import type { FileUploadMode } from './hooks/useFileHandling';

interface UploadMenuSectionProps {
    onFilesSelected: (files: File[]) => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    fileUploadMode: FileUploadMode;
    buttonIcon?: React.ReactNode;
}

const UploadMenuSection = ({
    onFilesSelected,
    onBrowseDrive,
    onDrawSketch,
    fileUploadMode,
    buttonIcon = <IcPlus size={4} />,
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
                // FIXME: Remove after releasing Lumo 2.0.0 — use getAcceptAttributeString() once iOS native app handles file picker without camera
                accept={isIos() ? getAcceptAttributeStringWithoutImages() : getAcceptAttributeString()}
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
            />
        </>
    );
};

const GalleryUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
            d="M10.334 7.09961C10.5444 7.03128 10.7701 7.02417 10.9844 7.0791C11.1322 7.11707 11.2536 7.18528 11.3584 7.25684C11.458 7.32486 11.5694 7.41468 11.6895 7.51074L13.5547 9.00293C13.7881 9.18967 13.969 9.33118 14.1084 9.50879C14.2731 9.71867 14.3902 9.96193 14.4512 10.2217C14.5028 10.4416 14.5 10.6716 14.5 10.9707C14.5 11.0919 14.4984 11.207 14.498 11.3164C14.4982 11.3219 14.5 11.3274 14.5 11.333C14.5 11.9206 14.5044 12.3126 14.415 12.6465C14.3854 12.7569 14.3473 12.8641 14.3037 12.9678C14.3017 12.9727 14.3009 12.9785 14.2988 12.9834C14.2937 12.9954 14.2866 13.0066 14.2812 13.0186C14.2604 13.0652 14.2384 13.1112 14.2148 13.1562C14.2049 13.1753 14.195 13.1942 14.1846 13.2129C14.1116 13.3442 14.0271 13.4677 13.9326 13.583C13.9284 13.5882 13.9242 13.5935 13.9199 13.5986C13.8292 13.7075 13.7298 13.8084 13.6221 13.9004C13.6045 13.9154 13.5864 13.9298 13.5684 13.9443C13.459 14.0325 13.3423 14.1116 13.2188 14.1807C13.202 14.19 13.185 14.199 13.168 14.208C13.1138 14.2367 13.0585 14.2633 13.002 14.2881C12.9956 14.2909 12.9898 14.2951 12.9834 14.2979C12.9816 14.2986 12.9793 14.299 12.9775 14.2998C12.8711 14.345 12.761 14.3836 12.6475 14.4141C12.3135 14.5035 11.9208 14.5 11.333 14.5H4.71289C4.54252 14.5 4.3844 14.4975 4.25195 14.4902C4.10559 14.486 3.97046 14.4809 3.8457 14.4707C3.4814 14.4409 3.16129 14.3783 2.86523 14.2275C2.39486 13.9879 2.01215 13.6051 1.77246 13.1348C1.62161 12.8387 1.55908 12.5186 1.5293 12.1543C1.5 11.7957 1.5 11.3515 1.5 10.7998V5.19922C1.5 4.64779 1.50003 4.20414 1.5293 3.8457C1.55907 3.48128 1.62157 3.1604 1.77246 2.86426C2.01216 2.39401 2.39494 2.01209 2.86523 1.77246C3.16137 1.62158 3.4813 1.55809 3.8457 1.52832C4.20428 1.49903 4.64841 1.5 5.2002 1.5H8.33301C8.60915 1.5 8.83301 1.72386 8.83301 2C8.83283 2.27599 8.60904 2.5 8.33301 2.5H5.2002C4.63189 2.5 4.23518 2.50019 3.92676 2.52539C3.62462 2.5501 3.45093 2.5961 3.31934 2.66309C3.03713 2.80688 2.8069 3.03616 2.66309 3.31836C2.59599 3.45003 2.55011 3.62419 2.52539 3.92676C2.5002 4.2351 2.5 4.63116 2.5 5.19922V10.7998C2.5 11.3679 2.50022 11.7639 2.52539 12.0723C2.5501 12.3747 2.59604 12.549 2.66309 12.6807C2.8069 12.9629 3.03709 13.1921 3.31934 13.3359C3.35046 13.3518 3.38392 13.3664 3.4209 13.3799C3.47909 13.242 3.56793 13.1372 3.62793 13.0723C3.72729 12.9647 3.86636 12.8396 4.01758 12.7021L9.65723 7.5752C9.77105 7.47172 9.87652 7.37497 9.97168 7.30078C10.0719 7.2227 10.1887 7.14681 10.334 7.09961ZM10.6426 8.05078C10.6362 8.05413 10.6194 8.06455 10.5869 8.08984C10.5285 8.13535 10.4551 8.20176 10.3301 8.31543L4.69043 13.4414C4.6693 13.4606 4.64891 13.4788 4.62988 13.4961C4.79877 13.4975 4.98752 13.5 5.2002 13.5H10.9707C11.4574 13.5 11.7971 13.4991 12.0625 13.4805C12.2763 13.4654 12.4161 13.4384 12.5234 13.4023C12.6133 13.3688 12.6987 13.3275 12.7793 13.2783C12.8165 13.2556 12.8527 13.2318 12.8877 13.2061C12.9025 13.1951 12.9173 13.1843 12.9316 13.1729C12.9764 13.1373 13.0202 13.1009 13.0605 13.0605C13.114 13.0071 13.1611 12.9478 13.2061 12.8867C13.2287 12.8559 13.2502 12.8245 13.2705 12.792C13.3242 12.7059 13.3696 12.6144 13.4053 12.5176C13.4404 12.4109 13.4667 12.2717 13.4814 12.0615C13.5001 11.7962 13.5 11.4571 13.5 10.9707C13.5 10.6242 13.4965 10.5309 13.4775 10.4502C13.4498 10.3321 13.3971 10.2214 13.3223 10.126C13.2711 10.0608 13.2001 10.0005 12.9297 9.78418L11.0645 8.29199C10.9325 8.18646 10.8551 8.12473 10.7939 8.08301C10.7591 8.05923 10.7415 8.05055 10.7354 8.04785C10.7048 8.04006 10.6726 8.04104 10.6426 8.05078ZM6.5 5.66602C6.49982 5.20604 6.12697 4.83318 5.66699 4.83301C5.20686 4.83301 4.83318 5.20593 4.83301 5.66602C4.83301 6.12625 5.20675 6.5 5.66699 6.5C6.12708 6.49982 6.5 6.12614 6.5 5.66602ZM12.167 5.33301V3.83301H10.667C10.3909 3.83301 10.167 3.60915 10.167 3.33301C10.167 3.05687 10.3909 2.83301 10.667 2.83301H12.167V1.33301C12.167 1.05687 12.3909 0.833008 12.667 0.833008C12.943 0.833183 13.167 1.05697 13.167 1.33301V2.83301H14.667C14.943 2.83318 15.167 3.05697 15.167 3.33301C15.167 3.60904 14.943 3.83283 14.667 3.83301H13.167V5.33301C13.167 5.60904 12.943 5.83283 12.667 5.83301C12.3909 5.83301 12.167 5.60915 12.167 5.33301ZM7.5 5.66602C7.5 6.67843 6.67936 7.49982 5.66699 7.5C4.65447 7.5 3.83301 6.67854 3.83301 5.66602C3.83318 4.65364 4.65458 3.83301 5.66699 3.83301C6.67926 3.83318 7.49982 4.65375 7.5 5.66602Z"
            fill="#0C0C14"
            stroke="#0C0C14"
            strokeWidth="0.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export interface ComposerToolbarProps {
    composerMode: ComposerMode;
    onFilesSelected: (files: File[]) => void;
    onBrowseDrive: () => void;
    onDrawSketch: () => void;
    fileUploadMode: FileUploadMode;
    onCreateImage?: () => void;

    // From legacy composer component - can delete
    // hasAttachments: boolean;
    // canShowLumoUpsellToggle?: boolean;
}

export const ComposerToolbar = ({
    composerMode,
    onFilesSelected,
    onBrowseDrive,
    onDrawSketch,
    fileUploadMode,
    onCreateImage,
}: ComposerToolbarProps) => {
    const toolsButtonRef = useRef<HTMLButtonElement>(null);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const { externalTools: isLumoToolingEnabled } = useLumoFlags();

    const handleToolsButtonClick = useCallback(() => {
        setShowToolsMenu((prev) => !prev);
    }, []);

    const uploadSectionProps = { onFilesSelected, onBrowseDrive, onDrawSketch, fileUploadMode };

    if (composerMode === ComposerMode.GALLERY) {
        return (
            <div className="flex flex-row flex-nowrap items-center gap-1 pl-2 mt-1">
                <UploadMenuSection {...uploadSectionProps} buttonIcon={<GalleryUploadIcon />} />
            </div>
        );
    }

    return (
        <div className="flex flex-row flex-nowrap items-center justify-space-between w-full mt-1">
            <div className="flex flex-row flex-nowrap items-center gap-1 pl-2">
                <UploadMenuSection {...uploadSectionProps} />
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
                            onCreateImage={onCreateImage}
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
                <ModelModeDropdown />
            </div>
        </div>
    );
};
