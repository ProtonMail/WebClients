import type { FC } from 'react';

import { Avatar } from '@proton/atoms';
import { CircleLoader } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import './ShareMemberAvatar.scss';

type Props = { value: string; loading?: boolean };

export const ShareMemberAvatar: FC<Props> = ({ value, loading }) => (
    <div className="mr-4 relative">
        <Avatar className={clsx('rounded-lg pass-member--avatar', loading && 'opacity-30')}>{value}</Avatar>
        {loading && <CircleLoader size="small" className="z-up color-primary absolute inset-center opacity-60" />}
    </div>
);
