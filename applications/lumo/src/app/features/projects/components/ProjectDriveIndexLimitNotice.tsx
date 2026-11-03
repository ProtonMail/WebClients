import React from 'react';

import { c, msgid } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoSelector } from '../../../redux/hooks';

interface ProjectDriveIndexLimitNoticeProps {
    folderId: string;
}

export const ProjectDriveIndexLimitNotice = ({ folderId }: ProjectDriveIndexLimitNoticeProps) => {
    const indexedFolder = useLumoSelector((state) =>
        state.lumoUserSettings.indexedDriveFolders?.find((folder) => folder.nodeUid === folderId)
    );

    const skippedFiles = indexedFolder?.skippedFiles ?? 0;
    const totalFiles = indexedFolder?.totalIndexableFiles ?? 0;
    if (skippedFiles <= 0 || totalFiles <= 0) {
        return null;
    }

    const searchableFiles = totalFiles - skippedFiles;

    return (
        <Banner
            className="mb-2"
            variant="warning-outline"
            icon={<LumoIcon name="TriangleAlert" size={16} />}
        >
            {
                // translator: ${searchableFiles} is the number of files Lumo indexed, ${totalFiles} the number of supported files in the linked Drive folder (always more than ${searchableFiles}).
                c('collider_2025: Info').ngettext(
                    msgid`${LUMO_SHORT_APP_NAME} can search ${searchableFiles} of ${totalFiles} file in this folder. Link a smaller folder to include the rest.`,
                    `${LUMO_SHORT_APP_NAME} can search ${searchableFiles} of ${totalFiles} files in this folder. Link a smaller folder to include the rest.`,
                    totalFiles
                )
            }
        </Banner>
    );
};
