import type { VFC } from 'react';

import { Avatar } from '@proton/atoms/Avatar';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import clsx from '@proton/utils/clsx';

import './ShareMemberAvatar.scss';

type Props = { value: string; loading?: boolean };

export const ShareMemberAvatar: VFC<Props> = ({ value, loading }) => (
    <div className="mr-4 relative">
        <Avatar className={clsx('rounded-lg pass-member--avatar', loading && 'opacity-30')}>{value}</Avatar>
        {loading && <CircleLoader size="small" className="upper-layer color-primary absolute-center opacity-60" />}
    </div>
);
