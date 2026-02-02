import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcUsers } from '@proton/icons/icons/IcUsers';

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
                    <IcUsers alt={c('Action').t`Manage share`} />
                </Button>
            </Tooltip>
        </>
    );
};
