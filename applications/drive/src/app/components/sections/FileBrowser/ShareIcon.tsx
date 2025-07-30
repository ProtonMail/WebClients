import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';

interface Props {
    trashed: number | null;
    className?: string;
    isAdmin: boolean;
    onClick: () => void;
}

export const ShareIcon = ({ trashed, className, isAdmin, onClick }: Props) => {
    if (trashed || !isAdmin) {
        return null;
    }

    return (
        <>
            <Tooltip title={c('Action').t`Manage share`}>
                <Button icon shape="ghost" size="small" className={className} onClick={onClick}>
                    <Icon name="users" alt={c('Action').t`Manage share`} />
                </Button>
            </Tooltip>
        </>
    );
};
