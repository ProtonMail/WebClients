import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { formatEpoch } from '@proton/pass/utils/time/format';

type Props = { expirationTime: number };

export const DateBadge: FC<Props> = ({ expirationTime }) => {
    const date = useMemo(() => formatEpoch('dd MMMM yyyy, HH:mm')(expirationTime), [expirationTime]);

    return (
        <div className="w-full bg-weak flex flex-nowrap rounded-xl items-center justify-center py-4 px-8 mb-4">
            {
                // translator: full sentence is "This item is accessible until 10 February 2025, 11:45 or until the view limit is reached."
                c('Label').t`This item is accessible until ${date} or until the view limit is reached.`
            }
        </div>
    );
};
