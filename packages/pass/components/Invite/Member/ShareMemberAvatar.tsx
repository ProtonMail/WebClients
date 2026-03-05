import type { FC } from 'react';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import clsx from '@proton/utils/clsx';

import './ShareMemberAvatar.scss';

type Props = { email: string; isGroup: boolean; loading?: boolean };

export const ShareMemberAvatar: FC<Props> = ({ email, isGroup, loading }) => {
    const value = isGroup ? <IcUsers /> : email.toUpperCase().slice(0, 2);

    return (
        <div className="mr-4 relative">
            <Avatar className={clsx('rounded-lg pass-member--avatar', loading && 'opacity-30')}>{value}</Avatar>
            {loading && <CircleLoader size="small" className="z-up color-primary absolute inset-center opacity-60" />}
        </div>
    );
};
