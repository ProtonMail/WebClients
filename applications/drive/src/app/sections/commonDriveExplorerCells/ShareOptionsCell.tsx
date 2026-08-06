import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { ProtonDriveClient, ProtonDrivePhotosClient } from '@proton/drive';
import { useSharingModal } from '@proton/drive/modals/sharingModal';
import { IcUsers } from '@proton/icons/icons/IcUsers';

import type { CellDefinitionConfig } from '../../statelessComponents/DriveExplorer/types';

export interface ShareOptionsCellProps {
    nodeUid: string;
    drive: ProtonDriveClient | ProtonDrivePhotosClient;
    className?: string;
}

export function ShareOptionsCell({ nodeUid, drive, className }: ShareOptionsCellProps) {
    const { sharingModal, showSharingModal } = useSharingModal();

    return (
        <>
            <Tooltip title={c('Action').t`Manage share`}>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className={className}
                    onClick={() => showSharingModal({ nodeUid, drive })}
                >
                    <IcUsers alt={c('Action').t`Manage share`} />
                </Button>
            </Tooltip>
            {sharingModal}
        </>
    );
}

export const defaultShareOptionsCellConfig: CellDefinitionConfig = {
    id: 'share-options',
    className: 'file-browser-list--icon-column file-browser-list--context-menu-column flex items-center relative z-up',
    testId: 'column-share-options',
};
