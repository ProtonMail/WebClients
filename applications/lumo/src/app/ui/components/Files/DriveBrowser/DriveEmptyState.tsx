import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import { IcArrowUpLine } from '@proton/icons/icons/IcArrowUpLine';

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
        <div className="text-center py-8 text-gray-500">
            <p className="mb-4">{c('collider_2025: Info').t`This folder is empty`}</p>

            <div className="flex flex-row items-center justify-center gap-2">
                <Button
                    onClick={onUpload}
                    size="medium"
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
                        size="medium"
                        shape="outline"
                        disabled={isDisabled}
                        title={c('collider_2025: Action').t`Create folder`}
                    >
                        <Icon name="folder-plus" className="mr-1" />
                        {c('collider_2025: Action').t`Create folder`}
                    </Button>
                )}
            </div>
        </div>
    );
};
