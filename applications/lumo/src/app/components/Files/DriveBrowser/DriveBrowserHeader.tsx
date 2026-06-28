import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../LumoIcon/LumoIcon';

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
                            <LumoIcon name="ArrowLeft" size={16} aria-label={c('collider_2025: Action').t`Back`} />
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
                                <LumoIcon name="RotateCw" size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            </Button>

                            <Button
                                icon
                                size="small"
                                shape="ghost"
                                onClick={onUpload}
                                disabled={loading || isRefreshing || !hasCurrentFolder}
                                title={c('collider_2025: Action').t`Upload file to Drive`}
                            >
                                <LumoIcon name="ArrowUpToLine" size={16} />
                            </Button>
                        </>
                    )}

                    <Button icon className="shrink-0" size="small" shape="ghost" onClick={onClose}>
                        <LumoIcon name="X" size={16} aria-label={c('collider_2025: Action').t`Close`} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
