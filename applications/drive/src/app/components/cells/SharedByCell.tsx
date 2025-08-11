import { c } from 'ttag';

import { Avatar, UserAvatar, UserAvatarSizeEnum } from '@proton/atoms';
import { Icon, TableCell } from '@proton/components';

interface SharedByCellProps {
    displayName: string;
    isBookmark: boolean;
}

export const SharedByCell = ({ displayName, isBookmark }: SharedByCellProps) => {
    if (isBookmark) {
        return (
            <TableCell className="flex flex-nowrap items-center gap-2 m-0 w-1/5" data-testid="column-shared-by">
                <>
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
                </>
            </TableCell>
        );
    }

    return (
        <TableCell className="flex flex-nowrap items-center gap-2 m-0 w-1/5" data-testid="column-shared-by">
            {displayName && (
                <>
                    <UserAvatar name={displayName} size={UserAvatarSizeEnum.Small} />
                    <span className="text-ellipsis">{displayName}</span>
                </>
            )}
        </TableCell>
    );
};
