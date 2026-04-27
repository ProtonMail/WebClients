import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';

interface DriveEmptyStateProps {
    onUpload: () => void;
    onCreateFolder?: () => void;
    loading?: boolean;
    isRefreshing?: boolean;
    disabled?: boolean;
}

export const DriveEmptyState: React.FC<DriveEmptyStateProps> = ({
    onUpload,
    onCreateFolder,
    loading = false,
    isRefreshing = false,
    disabled = false,
}) => {
    const isDisabled = loading || isRefreshing || disabled;

    return (
        <div className="flex flex-column items-center justify-center text-center py-8 gap-4">
            <p className="m-0 color-weak text-sm">{c('collider_2025: Info').t`This folder is empty`}</p>

            <div className="flex flex-row items-center justify-center gap-2">
                <Button
                    onClick={onUpload}
                    size="small"
                    color="norm"
                    disabled={isDisabled}
                    title={c('collider_2025: Action').t`Upload files`}
                >
                    <IcArrowUpLine className="mr-1" />
                    {c('collider_2025: Action').t`Upload files`}
                </Button>
                {onCreateFolder && (
                    <Button
                        onClick={onCreateFolder}
                        size="small"
                        shape="outline"
                        disabled={isDisabled}
                        title={c('collider_2025: Action').t`Create folder`}
                    >
                        <IcFolderPlus className="mr-1" />
                        {c('collider_2025: Action').t`Create folder`}
                    </Button>
                )}
            </div>
        </div>
    );
};
