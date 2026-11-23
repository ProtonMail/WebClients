import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../LumoIcon/LumoIcon';

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
            <p className="m-0 lumo-body-small lumo-color-glyph-mid">{c('collider_2025: Info')
                .t`This folder is empty`}</p>

            <div className="flex flex-row items-center justify-center gap-2">
                <Button
                    onClick={onUpload}
                    size="small"
                    color="norm"
                    className="inline-flex flex-nowrap items-center gap-1"
                    disabled={isDisabled}
                    title={c('collider_2025: Action').t`Upload files`}
                >
                    <LumoIcon aria-hidden name="ArrowUpToLine" className="shrink-0" />
                    <span>{c('collider_2025: Action').t`Upload files`}</span>
                </Button>
                {onCreateFolder && (
                    <Button
                        onClick={onCreateFolder}
                        size="small"
                        shape="outline"
                        className="inline-flex flex-nowrap items-center gap-1"
                        disabled={isDisabled}
                        title={c('collider_2025: Action').t`Create folder`}
                    >
                        <LumoIcon aria-hidden name="FolderPlus" className="shrink-0" />
                        <span>{c('collider_2025: Action').t`Create folder`}</span>
                    </Button>
                )}
            </div>
        </div>
    );
};
