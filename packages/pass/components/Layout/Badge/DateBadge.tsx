import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { formatEpoch } from '@proton/pass/utils/time/format';

type Props = { expirationTime: number };

export const DateBadge: FC<Props> = ({ expirationTime }) => {
    const remaining = useMemo(() => formatEpoch('dd MMMM yyyy, HH:mm')(expirationTime), [expirationTime]);

    return (
        <div className="w-full bg-weak flex flex-nowrap rounded-xl items-center justify-center py-4 px-8 mb-4">
            {c('Label').t`This item will remain accessible until ${remaining}`}
        </div>
    );
};
