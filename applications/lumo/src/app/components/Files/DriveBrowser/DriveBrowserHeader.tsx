import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcCross } from '@proton/icons/icons/IcCross';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

interface DriveBrowserHeaderProps {
    onBack?: () => void;
    onClose?: () => void;
    onRefresh: () => void;
    onUpload: () => void;
    initialShowDriveBrowser: boolean;
    displayError: boolean;
    loading: boolean;
    isRefreshing: boolean;
    hasCurrentFolder: boolean;
    folderSelectionMode?: boolean;
    onLinkCurrentFolder?: () => void;
    currentFolderName?: string;
}

export const DriveBrowserHeader: React.FC<DriveBrowserHeaderProps> = ({
    onBack,
    onClose,
    onRefresh,
    onUpload,
    initialShowDriveBrowser,
    displayError,
    loading,
    isRefreshing,
    hasCurrentFolder,
    folderSelectionMode,
}) => {
    return (
        <div className="shrink-0 mb-4">
            <div className="flex flex-row items-center justify-space-between">
                {/* Left side: back + title */}
                <div className="flex flex-row flex-nowrap items-center gap-1">
                    {onBack && !initialShowDriveBrowser && (
                        <Button icon className="shrink-0" size="small" shape="ghost" onClick={onBack}>
                            <IcArrowLeft size={4} />
                        </Button>
                    )}
                    <p className="m-0 text-lg text-bold">{DRIVE_APP_NAME}</p>
                </div>

                {/* Right side: action buttons + close */}
                <div className="flex flex-row flex-nowrap items-center gap-1">
                    {!displayError && !folderSelectionMode && (
                        <>
                            <Button
                                icon
                                size="small"
                                shape="ghost"
                                onClick={onRefresh}
                                disabled={loading || isRefreshing}
                                title={c('collider_2025: Action').t`Refresh folder contents`}
                            >
                                <IcArrowRotateRight size={4} className={isRefreshing ? 'animate-spin' : ''} />
                            </Button>

                            <Button
                                icon
                                size="small"
                                shape="ghost"
                                onClick={onUpload}
                                disabled={loading || isRefreshing || !hasCurrentFolder}
                                title={c('collider_2025: Action').t`Upload file to Drive`}
                            >
                                <IcArrowUpLine size={4} />
                            </Button>
                        </>
                    )}

                    <Button icon className="shrink-0" size="small" shape="ghost" onClick={onClose}>
                        <IcCross size={4} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
