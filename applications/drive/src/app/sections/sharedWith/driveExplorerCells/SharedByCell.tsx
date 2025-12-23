import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { UserAvatar, UserAvatarSizeEnum } from '@proton/atoms/UserAvatar/UserAvatar';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { SortField } from '../../../hooks/util/useSorting';
import type { CellDefinitionConfig } from '../../../statelessComponents/DriveExplorer/types';

export interface SharedByCellProps {
    uid: string;
    displayName: string;
    isPublicLink?: boolean;
    className?: string;
}

export const SharedByCell = ({ displayName, isPublicLink = false, className }: SharedByCellProps) => {
    if (isPublicLink) {
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
                    <Icon className="color-weak" name="globe" />
                </Avatar>
                <span className="text-ellipsis color-weak">{c('Info').t`Public link`}</span>
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

export const defaultSharedByCellConfig: CellDefinitionConfig = {
    id: 'sharedBy',
    headerText: c('Label').t`Shared by`,
    className: 'w-1/5',
    sortField: SortField.sharedBy,
    testId: 'column-shared-by',
};
