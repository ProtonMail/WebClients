import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { UserAvatar, UserAvatarSizeEnum } from '@proton/atoms/UserAvatar/UserAvatar';
import { Icon } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { stringComparator } from '../../../modules/sorting/comparators';
import { SortField } from '../../../modules/sorting/types';
import type { CellDefinitionConfig } from '../../../statelessComponents/DriveExplorer/types';

export interface UploadedByCellProps {
    displayName: string | undefined;
    className?: string;
}

// TODO: Find a way to combine with ShareByCell
export const UploadedByCell = ({ displayName, className }: UploadedByCellProps) => {
    if (!displayName) {
        return (
            <div className={clsx('flex flex-nowrap items-center gap-2', className)}>
                <Avatar
                    color="weak"
                    className="min-w-custom max-w-custom max-h-custom"
                    style={{
                        '--min-w-custom': '1.75rem',
                        '--max-w-custom': '1.75rem',
                        '--max-h-custom': '1.75rem',
                    }}
                >
                    <Icon className="color-weak" name="user" />
                </Avatar>
                <span className="text-ellipsis color-weak">{c('Info').t`Anonymous`}</span>
            </div>
        );
    }

    return (
        <div className={`flex flex-nowrap items-center gap-2 ${className || ''}`}>
            <UserAvatar name={displayName} size={UserAvatarSizeEnum.Small} />
            <span className="text-ellipsis">{displayName}</span>
        </div>
    );
};

export const defaultUploadedByCellConfig: CellDefinitionConfig = {
    id: 'uploadedBy',
    headerText: c('Label').t`Uploaded by`,
    className: 'w-1/5',
    sortField: SortField.uploadedBy,
    sortConfig: [
        { field: SortField.uploadedBy, comparator: stringComparator },
        { field: SortField.name, comparator: stringComparator, direction: SORT_DIRECTION.ASC },
    ],
    testId: 'column-shared-by',
};
