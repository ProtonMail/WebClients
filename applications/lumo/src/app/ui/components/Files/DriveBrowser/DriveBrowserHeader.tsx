import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { IcArrowLeft, IcCross } from '@proton/icons';
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
}) => {
    return (
        <div className="mb-4">
            <div className="flex flex-row flex-nowrap items-center justify-space-between mb-2">
                <div className="flex flex-row items-center gap-1">
                    <div className="flex flex-row items-center gap-1">
                        {onBack && !initialShowDriveBrowser && (
                            <>
                                <Button onClick={onBack} size="small" shape="ghost">
                                    <IcArrowLeft name="arrow" size={4} />
                                </Button>
                            </>
                        )}

                        <p className="m-0 text-lg text-bold">{DRIVE_APP_NAME}</p>

                        {!displayError && (
                            <>
                                <Button
                                    onClick={onRefresh}
                                    size="small"
                                    shape="ghost"
                                    disabled={loading || isRefreshing}
                                    title={c('collider_2025: Action').t`Refresh folder contents`}
                                >
                                    <Icon
                                        name="arrow-rotate-right"
                                        size={4}
                                        className={isRefreshing ? 'animate-spin' : ''}
                                    />
                                </Button>

                                <Button
                                    onClick={onUpload}
                                    size="small"
                                    shape="ghost"
                                    disabled={loading || isRefreshing || !hasCurrentFolder}
                                    title={c('collider_2025: Action').t`Upload file and add to knowledge base`}
                                >
                                    <Icon name="arrow-up-line" size={4} />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <Button icon className="shrink-0" size="small" shape="ghost" onClick={onClose}>
                    <IcCross />
                </Button>
            </div>
        </div>
    );
};
