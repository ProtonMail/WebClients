import React from 'react';

import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../LumoIcon/LumoIcon';

interface DriveHiddenFilesNoticeProps {
    hiddenProtonDocsCount: number;
    hiddenUnsupportedCount: number;
}

export const DriveHiddenFilesNotice: React.FC<DriveHiddenFilesNoticeProps> = ({
    hiddenProtonDocsCount,
    hiddenUnsupportedCount,
}) => {
    if (hiddenProtonDocsCount === 0 && hiddenUnsupportedCount === 0) {
        return null;
    }

    return (
        <div className="mb-3 p-3 bg-weak rounded border border-weak">
            <div className="flex items-center gap-2 text-sm color-weak">
                <LumoIcon name="Info" size={16} />
                <div className="flex flex-col">
                    {hiddenProtonDocsCount > 0 && (
                        <span>
                            {hiddenProtonDocsCount}{' '}
                            {hiddenProtonDocsCount > 1
                                ? c('collider_2025: Info').t` ${BRAND_NAME} files are hidden (not supported yet)`
                                : c('collider_2025: Info').t` ${BRAND_NAME} file is hidden (not supported yet)`}
                        </span>
                    )}
                    {hiddenUnsupportedCount > 0 && (
                        <span>
                            {hiddenUnsupportedCount}{' '}
                            {hiddenUnsupportedCount > 1
                                ? c('collider_2025: Info').t` files are hidden (unsupported file types)`
                                : c('collider_2025: Info').t` file is hidden (unsupported file type)`}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
